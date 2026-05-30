import { Calendar } from "lucide-react"
import { useUpcomingEvents } from "../../services/posts"

function EventsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((n) => (
        <div key={n} className="flex gap-3">
          <div className="w-10 h-10 rounded bg-gray-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EventsWidget() {
  const { data: events = [], isLoading } = useUpcomingEvents(5)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface mb-3">
        <Calendar size={16} className="text-primary" />
        Upcoming Events
      </h3>

      {isLoading ? (
        <EventsSkeleton />
      ) : events.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/75 font-inter italic">No upcoming events scheduled.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const eventDate = new Date(event.date)
            const month = eventDate.toLocaleDateString("en-US", { month: "short" })
            const day = eventDate.toLocaleDateString("en-US", { day: "numeric" })
            const time = eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            const meta = `${event.location || "Virtual"} · ${time}`

            return (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-primary/10 text-primary shrink-0">
                  <span className="text-label-sm font-geist font-bold leading-none">{day}</span>
                  <span className="text-[10px] font-geist font-medium leading-none uppercase">{month}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-title-sm font-geist font-medium text-on-surface truncate" title={event.title}>
                    {event.title}
                  </p>
                  <p className="text-body-sm text-on-surface-variant font-inter truncate" title={meta}>
                    {meta}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
