import { use } from 'react'
import { EventRoom } from '@/components/event/EventRoom'

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EventRoom eventId={id} />
}
