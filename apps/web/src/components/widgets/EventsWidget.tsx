import { Calendar } from "lucide-react"

const events = [
  { date: "Oct 12", title: "Data Science Symposium", meta: "Virtual · 10:00 AM EST" },
  { date: "Oct 15", title: "Stats Dept Mixer", meta: "Student Union · 5:00 PM" },
]

export function EventsWidget() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface mb-3">
        <Calendar size={16} className="text-primary" />
        Upcoming Events
      </h3>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.title} className="flex gap-3">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-primary/10 text-primary shrink-0">
              <span className="text-label-sm font-geist font-bold leading-none">{event.date.split(" ")[1]}</span>
              <span className="text-[10px] font-geist font-medium leading-none">{event.date.split(" ")[0]}</span>
            </div>
            <div>
              <p className="text-title-sm font-geist font-medium text-on-surface">{event.title}</p>
              <p className="text-body-sm text-on-surface-variant font-inter">{event.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
