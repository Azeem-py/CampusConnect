import { useState } from "react"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-red-50/20 dark:bg-red-950/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500 stroke-[2.5]" size={18} />
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white font-geist">
              Report Content
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center my-6">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 flex items-center justify-center animate-bounce">
              <Check size={24} className="stroke-[3]" />
            </div>
            <p className="font-geist font-bold text-[16px] text-gray-900 dark:text-white">
              Thank you!
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-[280px]">
              Report submitted successfully. Our safety team will review this content shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh]">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 text-[13px] text-red-600 dark:text-red-400 font-inter">
                  ⚠️ {error}
                </div>
              )}

              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-inter">
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
                          ? "bg-red-50/30 border-red-400/80 ring-1 ring-red-400/50 dark:bg-red-950/10 dark:border-red-800"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 bg-white dark:bg-gray-900/50"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 dark:border-gray-700 group-hover:border-gray-400"
                      )}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold leading-tight",
                          isSelected ? "text-red-700 dark:text-red-400" : "text-gray-800 dark:text-gray-200"
                        )}>
                          {reason.label}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                          {reason.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 font-geist">
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
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500/10 focus:border-red-500/80 transition-all duration-200 placeholder-gray-400 font-inter resize-none"
                  />
                  <div className="absolute right-2.5 bottom-2.5 text-[10px] font-mono text-gray-400">
                    {description.length} / 300
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[13px] font-geist font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer"
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
                    : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
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
    </div>
  )
}
