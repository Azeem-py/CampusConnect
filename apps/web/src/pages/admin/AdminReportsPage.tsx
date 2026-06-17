import { useState } from "react"
import { useReports, useReportMetrics, useResolveReport } from "../../services/moderation"
import {
  CheckCircle,
  AlertOctagon,
  Clock,
  ChevronRight,
  Trash2,
  UserMinus,
  Check,
  X,
  Loader2,
  FileText,
  MessageSquare,
  User,
  ExternalLink,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { ReportReason, ReportStatus } from "@campus-connect/types"

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam / Ads",
  HARASSMENT: "Harassment",
  HATE_SPEECH: "Hate Speech",
  INAPPROPRIATE_CONTENT: "Inappropriate",
  INTELLECTUAL_PROPERTY: "Copyright/IP",
  OTHER: "Custom / Other",
}

export function AdminReportsPage() {
  const [activeStatusFilter, setActiveStatusFilter] = useState<ReportStatus>("PENDING")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const [resolutionNote, setResolutionNote] = useState("")
  const [deleteContent, setDeleteContent] = useState(true)
  const [banUser, setBanUser] = useState(false)
  const [resolutionError, setResolutionError] = useState<string | null>(null)

  const { data: metrics, refetch: refetchMetrics } = useReportMetrics()
  const { data: reportsResponse, isLoading: reportsLoading, refetch: refetchReports } = useReports(activeStatusFilter)
  const resolveMutation = useResolveReport()

  const reports = reportsResponse?.reports ?? []
  const selectedReport = reports.find(r => r.id === selectedReportId)

  const handleResolveSubmit = (status: "RESOLVED" | "DISMISSED") => {
    if (!selectedReportId) return
    setResolutionError(null)

    if (status === "RESOLVED" && selectedReport?.reason === "OTHER" && resolutionNote.trim().length < 5) {
      setResolutionError("Please provide a brief resolution note for 'Other' violations.")
      return
    }

    resolveMutation.mutate(
      {
        id: selectedReportId,
        payload: {
          status,
          resolutionNote: resolutionNote.trim() || undefined,
          deleteContent: status === "RESOLVED" ? deleteContent : undefined,
          banUser: status === "RESOLVED" ? banUser : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedReportId(null)
          setResolutionNote("")
          setDeleteContent(true)
          setBanUser(false)
          refetchMetrics()
          refetchReports()
        },
        onError: (err: any) => {
          setResolutionError(err.response?.data?.message || "Failed to resolve report.")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400 font-geist uppercase tracking-widest">
              Pending Review
            </p>
            <p className="text-3xl font-geist font-bold text-amber-900 dark:text-amber-300">
              {metrics?.pending ?? 0}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock size={22} className="animate-pulse" />
          </div>
        </div>

        <div className="bg-green-50/20 dark:bg-green-950/10 border border-green-200/40 dark:border-green-900/30 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-bold text-green-700/80 dark:text-green-400 font-geist uppercase tracking-widest">
              Reports Resolved
            </p>
            <p className="text-3xl font-geist font-bold text-green-900 dark:text-green-300">
              {metrics?.resolved ?? 0}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl text-green-600 dark:text-green-400">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 font-geist uppercase tracking-widest">
              Dismissed Reports
            </p>
            <p className="text-3xl font-geist font-bold text-gray-800 dark:text-gray-300">
              {metrics?.dismissed ?? 0}
            </p>
          </div>
          <div className="p-3 bg-gray-500/10 rounded-xl text-gray-500 dark:text-gray-400">
            <X size={22} />
          </div>
        </div>

        <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/30 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-700/80 dark:text-red-400 font-geist uppercase tracking-widest">
              Banned Profiles
            </p>
            <p className="text-3xl font-geist font-bold text-red-900 dark:text-red-300">
              {metrics?.activeInfractions ?? 0}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
            <AlertOctagon size={22} />
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-2 gap-1">
          {(["PENDING", "RESOLVED", "DISMISSED"] as ReportStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatusFilter(status)
                setSelectedReportId(null)
              }}
              className={cn(
                "px-4 py-2 text-xs font-semibold font-geist rounded-lg transition-all cursor-pointer",
                activeStatusFilter === status
                  ? "bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-sm border border-gray-250/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {reportsLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs font-geist text-gray-400">Fetching report logs...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckCircle size={36} className="text-green-500 mx-auto" />
            <p className="font-geist font-bold text-gray-800 dark:text-gray-200">
              No reports logged!
            </p>
            <p className="text-xs text-gray-400 max-w-[240px] mx-auto font-inter">
              Good work! All logs for the status {activeStatusFilter} are clean.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-geist bg-gray-50/20 dark:bg-gray-950/10">
                  <th className="px-6 py-3.5">Violation</th>
                  <th className="px-6 py-3.5">Reporter</th>
                  <th className="px-6 py-3.5">Target Content</th>
                  <th className="px-6 py-3.5">Logged Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map((report) => {
                  let targetLabel = "Unknown Target"
                  if (report.postId) targetLabel = "Post"
                  else if (report.commentId) targetLabel = "Comment"
                  else if (report.reportedUserId) targetLabel = "User Profile"

                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={cn(
                        "hover:bg-gray-50/40 dark:hover:bg-gray-850/30 transition-colors cursor-pointer group/row font-inter text-sm text-gray-700 dark:text-gray-300",
                        selectedReportId === report.id ? "bg-primary/5 dark:bg-primary/5" : ""
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold font-geist bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-150/10">
                          {REASON_LABELS[report.reason]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {report.reporter.name}
                        </span>
                        <span className="text-xs text-gray-400 block mt-0.5">
                          @{report.reporter.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-geist font-medium">
                          {report.postId && <FileText size={14} className="text-blue-500" />}
                          {report.commentId && <MessageSquare size={14} className="text-green-500" />}
                          {report.reportedUserId && <User size={14} className="text-purple-500" />}
                          <span>{targetLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-all">
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Action Drawer Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
          onClick={() => setSelectedReportId(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-geist uppercase tracking-wider">
                  Report Incident Details
                </h3>
                <span className="text-xs font-mono text-gray-400 block mt-0.5">
                  ID: {selectedReport.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedReportId(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {resolutionError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 text-xs text-red-600 dark:text-red-400 font-inter">
                  {resolutionError}
                </div>
              )}

              <div className="space-y-1 bg-gray-50/60 dark:bg-gray-950/10 border border-gray-100 dark:border-gray-800 p-3.5 rounded-xl font-inter text-sm">
                <span className="text-xs font-geist font-bold text-gray-400 uppercase tracking-widest">Reporter</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedReport.reporter.name} (@{selectedReport.reporter.username})
                </p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-white dark:bg-gray-900/60 border border-gray-150/30 p-2.5 rounded-lg italic">
                  &ldquo;{selectedReport.description || "No description logged by reporter."}&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-geist font-bold text-gray-400 uppercase tracking-widest">Reported Content Target</span>

                {selectedReport.post && (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 space-y-2 bg-gray-50/20 font-inter">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-geist font-semibold text-blue-600 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                        Post Content
                      </span>
                      <a
                        href={`/post/${selectedReport.post.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold font-geist text-primary hover:underline flex items-center gap-0.5"
                      >
                        Open <ExternalLink size={10} />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      Author: {selectedReport.post.author.name} (@{selectedReport.post.author.username})
                    </p>
                    <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 border-t border-gray-100 dark:border-gray-800 pt-2 leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {selectedReport.post.content}
                    </div>
                  </div>
                )}

                {selectedReport.comment && (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 space-y-2 bg-gray-50/20 font-inter">
                    <span className="text-xs font-geist font-semibold text-green-600 uppercase tracking-wider bg-green-50/50 dark:bg-green-950/20 px-2 py-0.5 rounded">
                      Comment Content
                    </span>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      Author: {selectedReport.comment.author.name} (@{selectedReport.comment.author.username})
                    </p>
                    <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 border-t border-gray-100 dark:border-gray-800 pt-2 leading-relaxed max-h-36 overflow-y-auto">
                      {selectedReport.comment.content}
                    </div>
                  </div>
                )}

                {selectedReport.reportedUser && (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 flex items-center gap-3 bg-gray-50/20 font-inter">
                    <img
                      src={selectedReport.reportedUser.avatar || "https://ui-avatars.com/api/?name=User&background=1e3a8a&color=fff"}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-geist font-semibold text-purple-600 uppercase tracking-wider bg-purple-50/50 dark:bg-purple-950/20 px-2 py-0.5 rounded">
                        User Profile
                      </span>
                      <h4 className="font-geist font-bold text-sm text-gray-900 dark:text-white mt-1 truncate">
                        {selectedReport.reportedUser.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        @{selectedReport.reportedUser.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {activeStatusFilter === "PENDING" ? (
                <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-geist font-bold text-gray-400 uppercase tracking-widest">Enforce Sanctions</span>

                  <div className="space-y-2">
                    {(selectedReport.postId || selectedReport.commentId) && (
                      <label className="flex items-center gap-2.5 font-inter text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={deleteContent}
                          onChange={(e) => setDeleteContent(e.target.checked)}
                          className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <Trash2 size={13} />
                          Delete Reported Content
                        </div>
                      </label>
                    )}

                    <label className="flex items-center gap-2.5 font-inter text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={banUser}
                        onChange={(e) => setBanUser(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                        <UserMinus size={13} />
                        Suspend Profile & Deduct -20 Rep
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-geist">
                      Resolution Note {selectedReport.reason === "OTHER" && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows={2.5}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Add an explanation for the action..."
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-250/70 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 placeholder-gray-400 font-inter resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800 font-inter text-sm">
                  <span className="text-xs font-geist font-bold text-gray-400 uppercase tracking-widest">Resolution Summary</span>
                  <div className="space-y-1.5 bg-gray-50/50 dark:bg-gray-950/10 p-3 rounded-xl border border-gray-100 dark:border-gray-850">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Status: <span className={cn(activeStatusFilter === "RESOLVED" ? "text-green-600" : "text-gray-500")}>{activeStatusFilter}</span>
                    </p>
                    {selectedReport.resolutionNote && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed italic">
                        Note: &ldquo;{selectedReport.resolutionNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeStatusFilter === "PENDING" && (
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolveSubmit("DISMISSED")}
                  className="px-4 py-2 rounded-lg text-xs font-geist font-semibold text-gray-550 border border-gray-250/70 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer flex items-center gap-1"
                >
                  <X size={14} />
                  Dismiss Report
                </button>

                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolveSubmit("RESOLVED")}
                  className={cn(
                    "px-4.5 py-2 rounded-lg text-xs font-geist font-semibold transition-all duration-150 cursor-pointer select-none flex items-center gap-1.5 text-white bg-red-600 hover:bg-red-700 active:scale-[0.98]",
                    resolveMutation.isPending && "bg-red-500/70 cursor-not-allowed"
                  )}
                >
                  {resolveMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      Apply Actions
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
