import { MonthlyPlanRoom } from '@/components/monthly-plan/MonthlyPlanRoom'

export default async function MonthlyPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { id } = await params
  const { start, end } = await searchParams

  return (
    <MonthlyPlanRoom
      planId={id}
      startMonth={start ?? ''}
      endMonth={end ?? ''}
    />
  )
}
