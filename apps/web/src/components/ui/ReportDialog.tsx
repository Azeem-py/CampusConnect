import { useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"
import { useCreateReport } from "../../services/moderation"
import { cn } from "../../lib/utils"
import { ReportReason } from "@campus-connect/types"

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  postId?: string
  commentId?: string
  reportedUserId?: string
  onSuccess?: () => void
}

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: "SPAM", label: "Spam or Advertising", desc: "Unsolicited promotional content, phishing links, or repetitive postings." },
  { value: "HARASSMENT", label: "Harassment or Bullying", desc: "Targeted insults, personal attacks, intimidation, or hateful comments." },
  { value: "HATE_SPEECH", label: "Hate Speech", desc: "Discrimination or violence against protected groups or individuals." },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content", desc: "Explicit media, highly offensive language, or academic cheating tools." },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property", desc: "Plagiarism, posting copyrighted lecture slides, or sharing textbook PDFs without rights." },
  { value: "OTHER", label: "Other / Custom violation", desc: "Any other behavior violating campus guidelines or academic integrity." },
]

export function ReportDialog({
  isOpen,
  onClose,
  postId,
  commentId,
  reportedUserId,
  onSuccess,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const createReport = useCreateReport()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      setError("Please select a reason for reporting.")
      return
    }

    if (selectedReason === "OTHER" && description.trim().length < 10) {
      setError("Please provide a description of at least 10 characters for 'Other' violations.")
      return
    }

    setError(null)
    createReport.mutate(
      {
        reason: selectedReason,
        description: description.trim() || undefined,
        postId,
        commentId,
        reportedUserId,
      },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            setSelectedReason(null)
            setDescription("")
            onSuccess?.()
            onClose()
          }, 1800)
        },
        onError: (err: any) => {
          setError(err.response?.data?.message || "Failed to submit report. Please try again.")
        },
      }
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest border border-outline-variant/20 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-red-500/10 dark:bg-red-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500 stroke-[2.5]" size={18} />
            <h3 className="text-[16px] font-bold text-on-surface font-geist">
              Report Content
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center my-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center animate-bounce">
              <Check size={24} className="stroke-[3]" />
            </div>
            <p className="font-geist font-bold text-[16px] text-on-surface">
              Thank you!
            </p>
            <p className="text-[13px] text-on-surface-variant max-w-[280px]">
              Report submitted successfully. Our safety team will review this content shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh]">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-[13px] text-red-600 dark:text-red-400 font-inter">
                  ⚠️ {error}
                </div>
              )}

              <p className="text-[13px] text-on-surface-variant font-inter">
                Please select the reason that best describes the rule violation:
              </p>

              {/* Reason Selector Cards */}
              <div className="space-y-2">
                {REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.value
                  return (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => {
                        setSelectedReason(reason.value)
                        setError(null)
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border font-inter text-[13px] transition-all duration-150 flex items-start gap-3 group relative cursor-pointer",
                        isSelected
                          ? "bg-red-500/8 border-red-500/60 ring-1 ring-red-500/40 dark:bg-red-500/10 dark:border-red-500/70"
                          : "border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-lowest"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected
                          ? "border-red-650 bg-red-650 text-white"
                          : "border-outline-variant/85 group-hover:border-outline-variant"
                      )}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold leading-tight",
                          isSelected ? "text-red-600 dark:text-red-400" : "text-on-surface"
                        )}>
                          {reason.label}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">
                          {reason.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[12px] font-semibold text-on-surface font-geist">
                  Additional Details {selectedReason === "OTHER" && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setError(null)
                    }}
                    placeholder={
                      selectedReason === "OTHER"
                        ? "Please describe the issue in detail (minimum 10 characters)..."
                        : "Describe the context (optional, max 300 characters)..."
                    }
                    className="w-full bg-surface border border-outline-variant/20 rounded-xl px-3 py-2 text-[13px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-red-500/15 focus:border-red-500 transition-all duration-200 placeholder:text-on-surface-variant/40 font-inter resize-none"
                  />
                  <div className="absolute right-2.5 bottom-2.5 text-[10px] font-mono text-on-surface-variant/50">
                    {description.length} / 300
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-outline-variant/15 flex items-center justify-end gap-3 bg-surface-container-low/40 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[13px] font-geist font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createReport.isPending}
                className={cn(
                  "px-5 py-2 rounded-lg text-[13px] font-geist font-semibold transition-all duration-150 cursor-pointer select-none flex items-center gap-1.5",
                  createReport.isPending
                    ? "bg-red-500/70 text-white cursor-not-allowed"
                    : "bg-red-650 text-white hover:bg-red-750 active:scale-[0.98] focus:ring-2 focus:ring-red-500/30"
                )}
              >
                {createReport.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
