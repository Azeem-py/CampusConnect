import { type FormEvent, useState } from "react"
import { Dialog } from "../ui/Dialog"
import { Button } from "../ui/Button"

export interface EventData {
  title: string
  date: string
  time: string
  location: string
  description: string
}

interface EventDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: EventData) => void
  initial?: EventData
}

export function EventDialog({ open, onClose, onSave, initial }: EventDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [date, setDate] = useState(initial?.date ?? "")
  const [time, setTime] = useState(initial?.time ?? "")
  const [location, setLocation] = useState(initial?.location ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date.trim()) return
    onSave({ title: title.trim(), date: date.trim(), time: time.trim(), location: location.trim(), description: description.trim() })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add Event">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Event title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 placeholder:text-on-surface-variant/40"
            placeholder="e.g. Data Science Symposium"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
            />
          </div>
          <div className="flex-1">
            <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 placeholder:text-on-surface-variant/40"
            placeholder="e.g. Student Union · Room 201"
          />
        </div>

        <div>
          <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 resize-none placeholder:text-on-surface-variant/40"
            placeholder="Optional details about the event..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/10">
          <Button type="button" variant="ghost" onClick={onClose} className="px-4">Cancel</Button>
          <Button type="submit" disabled={!title.trim() || !date.trim()} className="px-5">Add Event</Button>
        </div>
      </form>
    </Dialog>
  )
}
