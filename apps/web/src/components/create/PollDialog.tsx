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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-label-md font-geist font-semibold text-on-surface mb-1.5">Poll question *</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 placeholder:text-on-surface-variant/40"
            placeholder="e.g. Which research topic interests you most?"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-label-md font-geist font-semibold text-on-surface mb-2">
            Options (min 2)
          </label>
          <div className="space-y-2.5">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/8 text-primary text-label-sm font-geist font-semibold shrink-0">
                  {index + 1}
                </span>
                <input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-body-md font-inter focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 placeholder:text-on-surface-variant/40"
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 rounded-xl hover:bg-error/8 text-on-surface-variant hover:text-error transition-all duration-150"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 inline-flex items-center gap-1.5 text-label-md font-geist font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={15} />
            Add option
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/10">
          <Button type="button" variant="ghost" onClick={onClose} className="px-4">Cancel</Button>
          <Button
            type="submit"
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            className="px-5"
          >
            Add Poll
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
