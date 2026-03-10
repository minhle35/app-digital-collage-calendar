import { EventRoom } from '@/components/event/EventRoom'

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventRoom eventId={params.id} />
}
