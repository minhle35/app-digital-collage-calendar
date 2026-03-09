import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <p>This page seems to have wandered off.</p>
      <Link href="/canvas/new">Back to your canvas</Link>
    </div>
  )
}
