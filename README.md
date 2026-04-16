# DayMark

A collaborative canvas where people drop photos, stickers, and memories together in real time — then take a photo booth shot as a group.

**Live → [app-digital-collage-calendar.railway.app](https://app-digital-collage-calendar-production-2f46.up.railway.app/)**

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, async params, API routes |
| Language | TypeScript 5.7 | End-to-end type safety across canvas elements |
| Styling | Tailwind CSS 4 + oklch | Perceptual color model; `html-to-image` compatible |
| Real-time | Liveblocks v3 | Shared storage (LiveList/LiveObject), presence, broadcast |
| Video | WebRTC (P2P) | Peer-to-peer via Liveblocks signaling — no media server |
| Export | html-to-image | Compatible with Tailwind CSS 4 oklch (html2canvas is not) |
| Package manager | pnpm | Lockfile-safe installs on Railway via nixpacks |
| Deployment | Railway | Persistent Node.js process; in-memory rate limiting works correctly |

---

## Architecture

### Routes

```
/                          Landing page
/event/new                 Rate-limited event creation → redirect
/event/[id]                Collaborative canvas (Liveblocks room)
/monthly-plan/[id]         Multi-month calendar planner (Liveblocks room)
                           ?start=2026-04&end=2026-09

/canvas/new                Solo canvas creation → redirect
/canvas/[id]               Solo canvas (Liveblocks persistence only)

/api/event/new             POST — creates event ID, rate-limited
/api/monthly-plan/new      POST — creates planner ID, rate-limited
/api/liveblocks-auth       POST — anonymous JWT for room access
```

### Canvas element model

All canvas objects share a base (`id`, `x`, `y`, `width`, `height`, `rotation`, `zIndex`, `locked`) and extend into six types:

```
AnyElement = PhotoElement | StickerElement | TextElement
           | ShapeElement | WashiElement   | HighlightElement
```

Elements are stored as a `LiveList<AnyElement>` in Liveblocks for event canvases, and as `JSON.stringify(AnyElement[])` in a `LiveObject` for solo canvases.

### State management

| Canvas | State | Persistence |
|---|---|---|
| Solo `/canvas/[id]` | `useReducer` (DayMarkContext) | Liveblocks LiveObject, debounced 1s |
| Event `/event/[id]` | Liveblocks `useStorage` / `useMutation` | Liveblocks LiveList (real-time) |
| Monthly plan | Liveblocks `useStorage` / `useMutation` | Liveblocks LiveList (entries) |

### Collaborative photobooth

Two-person booth uses a state machine over Liveblocks broadcast events:

```
idle → ready-sent → prompt → countdown → flash → strip → placed
```

WebRTC peer connection is established through Liveblocks broadcast (offer/answer/ICE). The lower `connectionId` is always the initiator. Both frames are stitched client-side into a Polaroid strip and added to the shared canvas.

### Monthly planner data model

```typescript
type PlanEntry = {
  id: string           // crypto.randomUUID()
  date: string         // "2026-05-14"
  eventRoomId: string  // links to /event/[id]
  title: string
  colorTag: string     // hex
  createdAt: number
}
// stored as LiveList<string> (JSON.stringify per entry)
```

The planner URL is the user's identity token — no auth required. Share the link to give others access to the same plan.

---

## Rate limiting

Two-layer in-memory fixed-window limiter (resets on redeploy):

```
Middleware          60 req/min per IP   all non-static routes
/api/event/new      1 per IP per 2h     + 100 global hard cap
/api/monthly-plan   3 per IP per 2h     + 5 global hard cap
/api/liveblocks-auth  10 req/min per IP
```

IP is read from `x-real-ip` (Railway proxy header, not spoofable) with `x-forwarded-for` as fallback.

> Works correctly on a single Railway instance. For multi-instance scale, swap the `Map` store for Upstash Redis.

---

## Local development

```bash
cp .env.example .env          # add Liveblocks keys
pnpm install
pnpm dev                      # http://localhost:3000
```

**Required env vars:**
```
LIVEBLOCKS_SECRET_KEY
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
```

---

## Deployment

Deployed on Railway via `nixpacks.toml`. On every push:

```
pnpm install --frozen-lockfile
pnpm build
pnpm start -p $PORT
```

No database. No media server. No auth service. Liveblocks handles all persistence and real-time sync.
