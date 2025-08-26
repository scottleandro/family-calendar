import CalendarView from '@/components/calendar/CalendarView'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // In v1, we skip fetching session server-side and rely on middleware to guard
  const userId = 'me'
  return <CalendarView userId={userId} />
}
