# Incident Report: Real-Time Photo Sync Bugs

**Branch:** `fix/sync-photo-upload`
**Date:** 2026-03-10
**Severity:** High — data mismatch visible across collaborators in the same event

---

## Summary

Three bugs caused photos uploaded by one user to be mismatched or invisible for other users sharing the same event. The core problems were: an illegal async Liveblocks mutation, a race condition between two non-atomic mutations, and a stale closure that allowed the limit guard to be bypassed locally.

---

## Bug 1 — `addToCanvas` used Liveblocks `storage` inside an async callback

**File:** `components/event/EventPhotosPanel.tsx`

### What happened

When a user clicked **+ Canvas** in the Photos panel, the element was not reliably added to the shared canvas — especially for other collaborators in the room.

### Root cause

`useMutation` in Liveblocks executes the callback **synchronously**. When the callback returns, the transaction is committed and the `storage` reference is closed. Any writes made to `storage` after the synchronous return are operating on a stale/closed context and do not propagate to other clients.

The original code did exactly this — it created an `Image` inside the mutation callback and wrote to `storage` inside `img.onload`, which fires asynchronously:

```ts
// ❌ Before
const addToCanvas = useMutation(({ storage }, photo: SavedPhoto) => {
  const img = new window.Image()
  img.onload = () => {
    // This fires AFTER the mutation has already committed.
    // storage is closed — push does not sync to other users.
    storage.get('elements').push(el)
  }
  img.src = photo.src  // mutation returns here, transaction closed
}, [])
```

### Fix

Separate the async image loading from the mutation. Load the image outside via `useCallback`, compute the dimensions, then call the mutation as a regular function with the pre-computed values:

```ts
// ✅ After
const addToCanvasMutation = useMutation(({ storage }, src: string, width: number, height: number) => {
  // Everything synchronous — transaction commits correctly
  storage.get('elements').push(el)
}, [])

const addToCanvas = useCallback((photo: SavedPhoto) => {
  const img = new window.Image()
  img.onload = () => {
    const w = 220
    addToCanvasMutation(photo.src, w, w / (img.width / img.height))
  }
  img.src = photo.src
}, [addToCanvasMutation])
```

---

## Bug 2 — `handleDrop` made two separate non-atomic mutations (race condition)

**File:** `components/event/EventCanvas.tsx`

### What happened

When two users simultaneously dragged an image onto the canvas at the moment only 1 photo slot remained, one user's photo would appear on the canvas for everyone but would be **absent from the Photos library panel** — a permanent mismatch with no way to recover.

### Root cause

The drag-drop handler called two separate mutations:

```ts
// ❌ Before
addElement({ id, type: 'photo', src, ... })   // Mutation 1: adds to elements, no limit check
savePhotoToLibrary(id, src)                    // Mutation 2: adds to photos, checks limit
```

Because these are two independent Liveblocks transactions, they are not atomic. Under concurrent usage:

1. User A and User B both drop an image when 1 slot remains.
2. Both `addElement` calls succeed — `elements` has no limit check.
3. Both `savePhotoToLibrary` mutations run. The first to arrive saves to `photos` (slot now full). The second is blocked by the `>= PHOTO_LIBRARY_LIMIT` guard.
4. Result: User B's photo is on the canvas for everyone, but it never appears in the Photos library.

### Fix

Combine both operations into a single atomic mutation that checks the limit once, then writes to both `elements` and `photos` in the same transaction. If the limit is already reached, neither write happens:

```ts
// ✅ After
const addPhotoElement = useMutation(({ storage }, id, src, x, y, w, h) => {
  const photos = storage.get('photos')
  if (photos.toArray().length >= PHOTO_LIBRARY_LIMIT) return  // single limit gate
  const list = storage.get('elements')
  list.push({ id, type: 'photo', x, y, width: w, height: h, src, ... })
  photos.push(JSON.stringify({ id, src, addedAt: Date.now() }))
}, [])
```

---

## Bug 3 — `photoCount` stale closure allowed local limit bypass

**File:** `components/event/EventCanvas.tsx`

### What happened

The local limit check in `handleDrop` could use a stale `photoCount` value, allowing `addElement` to run locally even when the photo library was already full (filled by another user). This caused the same canvas/library mismatch as Bug 2 even in non-concurrent scenarios.

### Root cause

`photoCount` was read from `useStorage` and used inside a `useCallback`, but was **missing from the dependency array**:

```ts
// ❌ Before
const handleDrop = useCallback((e) => {
  // photoCount here could be stale — captured at creation time
  if ((photoCount ?? 0) < PHOTO_LIBRARY_LIMIT) {
    addElement(...)       // ran with stale count
    savePhotoToLibrary()  // blocked by accurate mutation-level check
  }
}, [addElement, savePhotoToLibrary, elements])  // photoCount missing!
```

When `photoCount` was stale and lower than the real value, `addElement` would proceed while `savePhotoToLibrary` correctly blocked — producing the mismatch.

### Fix

Removing the local limit check entirely. The atomic `addPhotoElement` mutation (from Bug 2 fix) is now the single source of truth for the limit, using accurate live storage state at call time:

```ts
// ✅ After
const handleDrop = useCallback((e) => {
  // No local limit check — addPhotoElement handles it atomically
  addPhotoElement(id, src, x, y, w, h)
}, [addElement, addPhotoElement, elements])
```

---

## Additional Fix — Delete button click intercepted by overlay

**File:** `components/event/EventPhotosPanel.tsx`
**Commit:** previous (`e51f0f8`)

The Trash2 delete button in the Photos panel was positioned at `top-1 right-1` but the hover overlay (`absolute inset-0`) was rendered after it in DOM order, covering the button and intercepting all pointer events.

**Fix:** Added `z-10` to the delete button so it layers above the overlay.

---

## Files Changed

| File | Changes |
|------|---------|
| `components/event/EventPhotosPanel.tsx` | Restructured `addToCanvas` to separate async image loading from the Liveblocks mutation |
| `components/event/EventCanvas.tsx` | Replaced two-mutation pattern with single atomic `addPhotoElement` mutation; removed stale `photoCount` local guard and unused `savePhotoToLibrary` mutation |
