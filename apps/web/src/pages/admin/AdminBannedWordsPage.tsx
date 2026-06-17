import { useState } from "react"
import { useBannedWords, useCreateBannedWord, useUpdateBannedWord, useDeleteBannedWord } from "../../services/admin"
import { Loader2, Plus, Trash2, Edit3, AlertTriangle } from "lucide-react"
import { cn } from "../../lib/utils"

export function AdminBannedWordsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<{ id: string; pattern: string; isRegex: boolean } | null>(null)
  const [pattern, setPattern] = useState("")
  const [isRegex, setIsRegex] = useState(false)

  const { data: bannedWords, isLoading } = useBannedWords()
  const createMutation = useCreateBannedWord()
  const updateMutation = useUpdateBannedWord()
  const deleteMutation = useDeleteBannedWord()

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setPattern("")
    setIsRegex(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: { pattern, isRegex } })
    } else {
      await createMutation.mutateAsync({ pattern, isRegex })
    }
    resetForm()
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 font-geist">Content Filtering Active</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
            Words and phrases added here will be blocked from being used in any new posts and comments.
            Existing content is not affected. Regex patterns use JavaScript RegExp syntax.
          </p>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={() => { resetForm(); setShowForm(true) }}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-geist font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
      >
        <Plus size={15} />
        Add Banned Word
      </button>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : !bannedWords || bannedWords.length === 0 ? (
          <div className="p-8 text-center">
            <Ban size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-geist font-bold">No banned words</p>
            <p className="text-xs text-gray-400 mt-1">Add words or phrases to filter content.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {bannedWords.map((bw) => (
              <div key={bw.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/40 dark:hover:bg-gray-850/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-sm font-mono font-bold",
                    bw.isRegex
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200/40"
                      : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40"
                  )}>
                    {bw.pattern}
                  </span>
                  {bw.isRegex && (
                    <span className="text-xs font-geist font-bold text-purple-600 bg-purple-50/50 dark:bg-purple-950/10 px-2 py-0.5 rounded-full">
                      REGEX
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(bw); setPattern(bw.pattern); setIsRegex(bw.isRegex); setShowForm(true) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remove banned word "${bw.pattern}"?`)) deleteMutation.mutate(bw.id, { onError: () => alert("Failed to delete banned word. Please try again.") }) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={resetForm}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-geist font-bold text-lg text-on-surface mb-4">
              {editing ? "Edit Banned Word" : "Add Banned Word"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">
                  {editing?.isRegex ? "Regex Pattern" : "Word or Phrase"}
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  required
                  placeholder={editing?.isRegex ? "e.g. (badword|offensive)" : "e.g. spam"}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {editing?.isRegex
                    ? "Enter a valid JavaScript regex pattern."
                    : "Simple case-insensitive match. Partial matches will be blocked."}
                </p>
              </div>
              <label className="flex items-center gap-2.5 font-inter text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                />
                <span className="font-semibold">Use regex pattern matching</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editing ? "Save Changes" : "Add Word"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Ban(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}
