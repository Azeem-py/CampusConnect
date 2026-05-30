import { type FormEvent, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Dialog } from "../ui/Dialog"
import { Button } from "../ui/Button"

export interface PollData {
  question: string
  options: string[]
}

interface PollDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: PollData) => void
  initial?: PollData
}

export function PollDialog({ open, onClose, onSave, initial }: PollDialogProps) {
  const [question, setQuestion] = useState(initial?.question ?? "")
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""])

  const addOption = () => setOptions((prev) => [...prev, ""])

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || trimmed.length < 2) return
    onSave({ question: question.trim(), options: trimmed })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-md font-geist font-medium text-on-surface mb-1">Poll question *</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            placeholder="e.g. Which research topic interests you most?"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-label-md font-geist font-medium text-on-surface mb-1">
            Options (min 2)
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center gap-1.5 text-label-md font-geist font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={16} />
            Add option
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
          >
            Add Poll
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
