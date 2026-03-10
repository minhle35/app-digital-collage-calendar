import { use } from 'react'

export default function RemixedConfirmationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <div>Remixed from: {slug}</div>
}
