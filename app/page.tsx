import Link from 'next/link'

const steps = [
  {
    emoji: '🔗',
    tapeColor: '#f5c5ba',
    tapeTilt: '-rotate-2',
    rotate: 'rotate-1',
    title: 'Create & share a link',
    description:
      'Open a new canvas — you get a unique URL. Paste it in your group chat. No accounts, no installs, no friction.',
  },
  {
    emoji: '🎨',
    tapeColor: '#b8dfc8',
    tapeTilt: 'rotate-3',
    rotate: '-rotate-1',
    title: 'Decorate together, live',
    description:
      'Drop photos, layer stickers, add washi tape and handwritten notes. Every move shows up instantly for everyone in the room.',
  },
  {
    emoji: '📸',
    tapeColor: '#b8cff5',
    tapeTilt: '-rotate-1',
    rotate: 'rotate-2',
    title: 'Take a photo booth shot',
    description:
      'Trigger the two-person booth — both cameras count down in sync and the shot lands straight on your shared canvas.',
  },
  {
    emoji: '💾',
    tapeColor: '#f5e8a0',
    tapeTilt: 'rotate-2',
    rotate: '-rotate-1',
    title: 'Export and keep it',
    description:
      'Download the finished collage as a high-res PNG. No watermark, no paywall, no account required.',
  },
]

const plannerBullets = [
  {
    emoji: '📅',
    label: 'Pick your window',
    detail: 'Choose any start month and an end up to 3 months out.',
  },
  {
    emoji: '📌',
    label: 'Pin events to dates',
    detail: 'Click any day to name it and assign a colour — no canvas yet, just a plan.',
  },
  {
    emoji: '🖼️',
    label: 'Launch a canvas when ready',
    detail: 'Hit "Create canvas" on any pinned date and a live event URL opens instantly.',
  },
  {
    emoji: '🔖',
    label: 'Your URL = your plan',
    detail: 'Bookmark it or send it to yourself — return any time to see every event in one place.',
  },
]

const useCases = [
  { icon: '🎂', text: 'Birthday month — plan the dinner, the surprise, the group photo' },
  { icon: '✈️', text: 'Trip planning — one planner, every leg of the journey mapped out' },
  { icon: '🎓', text: 'Graduation season — keep each celebration linked and ready' },
  { icon: '🏠', text: 'Housewarming series — movie nights, dinners, game weekends' },
]

const btnPrimary =
  'inline-flex items-center gap-2.5 bg-[oklch(0.28_0.04_45)] text-[oklch(0.97_0.008_60)] px-8 py-4 text-sm font-semibold hover:bg-[oklch(0.22_0.04_45)] active:scale-[0.97] transition-all'
const btnSecondary =
  'inline-flex items-center gap-2.5 border-2 border-[oklch(0.28_0.04_45)] text-[oklch(0.28_0.04_45)] px-8 py-4 text-sm font-semibold hover:bg-[oklch(0.28_0.04_45)] hover:text-[oklch(0.97_0.008_60)] active:scale-[0.97] transition-all'
const btnStyle = { borderRadius: '2px', boxShadow: '4px 4px 0px oklch(0.65 0.13 48)' }

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'oklch(0.975 0.008 60)',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 31px, oklch(0.87 0.018 58 / 0.35) 31px, oklch(0.87 0.018 58 / 0.35) 32px)',
      }}
    >
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span
          className="text-2xl tracking-tight text-[oklch(0.18_0.02_50)]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          DayMark
        </span>
        <Link
          href="/canvas/new"
          className="text-xs uppercase tracking-widest text-[oklch(0.55_0.025_55)] hover:text-[oklch(0.18_0.02_50)] transition-colors"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          Solo studio →
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-10 pb-16 gap-8">
        <div className="relative h-24 w-80 select-none pointer-events-none" aria-hidden>
          <span className="absolute text-5xl" style={{ left: '2%',  top: '15%', transform: 'rotate(-14deg)' }}>📸</span>
          <span className="absolute text-3xl" style={{ left: '20%', top: '40%', transform: 'rotate(7deg)'  }}>✨</span>
          <span className="absolute text-4xl" style={{ left: '36%', top: '5%',  transform: 'rotate(-4deg)' }}>🎞️</span>
          <span className="absolute text-3xl" style={{ left: '55%', top: '30%', transform: 'rotate(13deg)' }}>💖</span>
          <span className="absolute text-4xl" style={{ left: '68%', top: '2%',  transform: 'rotate(-6deg)' }}>🌿</span>
          <span className="absolute text-3xl" style={{ left: '84%', top: '22%', transform: 'rotate(9deg)'  }}>⭐</span>
        </div>

        <span
          className="text-[10px] uppercase tracking-[0.2em] border border-[oklch(0.65_0.13_48)] text-[oklch(0.65_0.13_48)] px-3 py-1"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          No sign-up · Free to use
        </span>

        <h1
          className="text-5xl sm:text-[3.75rem] leading-[1.1] text-[oklch(0.18_0.02_50)] max-w-md"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Make something<br />
          <em style={{ fontStyle: 'italic' }}>beautiful,</em><br />
          together
        </h1>

        <p className="text-base text-[oklch(0.5_0.025_55)] leading-relaxed max-w-sm">
          Open a canvas, share the link with friends, and build a photo collage
          together — live, in the browser, no account needed.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/event/new" className={btnPrimary} style={btnStyle}>
            Create a free canvas
            <span aria-hidden className="text-[oklch(0.65_0.13_48)]">→</span>
          </Link>
          <Link href="/planner/new" className={btnSecondary} style={btnStyle}>
            Plan a month together
            <span aria-hidden>→</span>
          </Link>
          <span
            className="text-[11px] text-[oklch(0.6_0.025_55)] tracking-wide"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            both open instantly · no account needed
          </span>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────── */}
      <Divider label="how it works" />

      {/* ── Step cards ──────────────────────────────── */}
      <section className="max-w-3xl mx-auto w-full px-6 py-10">
        <ol className="grid sm:grid-cols-2 gap-10">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`relative bg-[oklch(0.995_0.004_65)] flex flex-col gap-3 px-6 pt-8 pb-6 ${step.rotate}`}
              style={{ borderRadius: '1px', boxShadow: '3px 5px 16px oklch(0.18 0.02 50 / 0.13), 0 1px 4px oklch(0.18 0.02 50 / 0.07)' }}
            >
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-6 opacity-75 ${step.tapeTilt}`}
                style={{ backgroundColor: step.tapeColor, borderRadius: '1px' }}
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none" aria-hidden>{step.emoji}</span>
                <span
                  className="text-[9px] font-bold tracking-[0.2em] uppercase border border-[oklch(0.65_0.13_48)] text-[oklch(0.65_0.13_48)] px-1.5 py-0.5"
                  style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '1px' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h2 className="text-lg leading-snug text-[oklch(0.18_0.02_50)]" style={{ fontFamily: 'var(--font-playfair)' }}>
                {step.title}
              </h2>
              <p className="text-sm text-[oklch(0.5_0.025_55)] leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Monthly Planner feature ──────────────────── */}
      <Divider label="monthly planner" />

      <section className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-10">

        {/* Header card — full width, rotated slightly */}
        <div
          className="relative bg-[oklch(0.995_0.004_65)] px-8 py-8 -rotate-1 flex flex-col gap-4"
          style={{ borderRadius: '1px', boxShadow: '4px 4px 0px oklch(0.65 0.13 48)' }}
        >
          {/* Tape */}
          <div className="absolute -top-3.5 left-10 w-20 h-6 opacity-75 rotate-1" style={{ backgroundColor: '#b8cff5', borderRadius: '1px' }} aria-hidden />
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>🗓️</span>
            <span
              className="text-[9px] font-bold tracking-[0.2em] uppercase border border-[oklch(0.65_0.13_48)] text-[oklch(0.65_0.13_48)] px-1.5 py-0.5"
              style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '1px' }}
            >
              New
            </span>
          </div>
          <h2 className="text-2xl text-[oklch(0.18_0.02_50)]" style={{ fontFamily: 'var(--font-playfair)' }}>
            One link. Every event this month.
          </h2>
          <p className="text-sm text-[oklch(0.5_0.025_55)] leading-relaxed max-w-lg">
            The Monthly Planner gives you a single URL that holds your entire month — pin events to dates,
            then launch a live canvas for each one when the day arrives.
            Bookmark it, email it to yourself, share it with your crew.
          </p>
        </div>

        {/* Two-column layout: bullets + use cases */}
        <div className="grid sm:grid-cols-2 gap-8">

          {/* How it works bullets */}
          <div className="flex flex-col gap-4">
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.6_0.025_55)]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              How it works
            </span>
            <ul className="flex flex-col gap-4">
              {plannerBullets.map((b) => (
                <li key={b.label} className="flex gap-3">
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden>{b.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-[oklch(0.18_0.02_50)]">{b.label}</p>
                    <p className="text-xs text-[oklch(0.5_0.025_55)] leading-relaxed mt-0.5">{b.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* URL model explanation card */}
          <div
            className="bg-[oklch(0.995_0.004_65)] flex flex-col gap-5 px-6 py-6 rotate-1"
            style={{ borderRadius: '1px', boxShadow: '3px 5px 16px oklch(0.18 0.02 50 / 0.1)' }}
          >
            {/* Tape */}
            <div className="absolute -top-3 right-8 w-12 h-5 opacity-70 -rotate-2" style={{ backgroundColor: '#b8dfc8', borderRadius: '1px' }} aria-hidden />

            <span
              className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.6_0.025_55)]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              Your URL model
            </span>

            {/* Planner URL */}
            <div className="flex flex-col gap-1.5">
              <span
                className="text-[9px] uppercase tracking-widest text-[oklch(0.65_0.13_48)]"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Planner (your home base)
              </span>
              <code
                className="text-xs bg-[oklch(0.93_0.02_65)] px-3 py-2 text-[oklch(0.28_0.04_45)]"
                style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '2px' }}
              >
                daymark.app/planner/<strong>abc12345</strong>
              </code>
              <p className="text-[11px] text-[oklch(0.55_0.025_55)] leading-relaxed">
                One URL per person. Holds all your planned dates. Bookmark it — returning here shows every event you've set up.
              </p>
            </div>

            <div className="h-px bg-[oklch(0.87_0.018_58)]" />

            {/* Event URL */}
            <div className="flex flex-col gap-1.5">
              <span
                className="text-[9px] uppercase tracking-widest text-[oklch(0.65_0.13_48)]"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                Event canvas (per occasion)
              </span>
              <code
                className="text-xs bg-[oklch(0.93_0.02_65)] px-3 py-2 text-[oklch(0.28_0.04_45)]"
                style={{ fontFamily: 'var(--font-space-mono)', borderRadius: '2px' }}
              >
                daymark.app/event/<strong>xyz99887</strong>
              </code>
              <p className="text-[11px] text-[oklch(0.55_0.025_55)] leading-relaxed">
                A fresh collaborative canvas for that specific day. Share with the people attending — they join with zero setup.
              </p>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="flex flex-col gap-4">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.6_0.025_55)]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            Good for
          </span>
          <ul className="grid sm:grid-cols-2 gap-3">
            {useCases.map((u) => (
              <li
                key={u.text}
                className="flex items-start gap-2.5 bg-[oklch(0.995_0.004_65)] px-4 py-3"
                style={{ borderRadius: '1px', boxShadow: '2px 2px 0px oklch(0.87 0.018 58)' }}
              >
                <span className="text-lg shrink-0" aria-hidden>{u.icon}</span>
                <span className="text-xs text-[oklch(0.4_0.025_55)] leading-relaxed">{u.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Planner CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Link href="/planner/new" className={btnSecondary} style={btnStyle}>
            Start your monthly plan →
          </Link>
          <p className="text-xs text-[oklch(0.6_0.025_55)]">
            You'll get a unique link — bookmark it or send it to yourself
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────── */}
      <Divider label="ready?" />

      <section className="flex flex-col items-center gap-3 px-6 pt-10 pb-20">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/event/new" className={btnPrimary} style={btnStyle}>
            Create a canvas now →
          </Link>
          <Link href="/planner/new" className={btnSecondary} style={btnStyle}>
            Plan a month →
          </Link>
        </div>
        <p className="text-xs text-[oklch(0.6_0.025_55)] text-center">
          Both open instantly — no account, no download
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[oklch(0.87_0.018_58)] px-8 py-5 text-center">
        <span
          className="text-[11px] tracking-widest uppercase text-[oklch(0.65_0.025_55)]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          Built with Next.js · Liveblocks · WebRTC
        </span>
      </footer>
    </main>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 px-8 py-2">
      <div className="flex-1 h-px bg-[oklch(0.87_0.018_58)]" />
      <span
        className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.6_0.025_55)]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-[oklch(0.87_0.018_58)]" />
    </div>
  )
}
