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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Event title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            placeholder="e.g. Data Science Symposium"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            placeholder="e.g. Student Union · Room 201"
          />
        </div>

        <div>
          <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
            placeholder="Optional details about the event..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim() || !date.trim()}>Add Event</Button>
        </div>
      </form>
    </Dialog>
  )
}
