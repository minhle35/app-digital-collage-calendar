import { use } from 'react'

export default function MilestoneTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <div>Milestone Timeline: {id}</div>
}
