import { useState } from "react"
import { useAdminPosts, useDeleteAdminPost, useFlagAdminPost, useUnflagAdminPost } from "../../services/admin"
import type { AdminPost } from "@campus-connect/types"
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Flag, CheckCircle, FileText, MessageSquare, ExternalLink } from "lucide-react"
import { cn } from "../../lib/utils"

export function AdminContentPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showComments, setShowComments] = useState(false)

  const { data, isLoading } = useAdminPosts({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  })

  const deletePostMutation = useDeleteAdminPost()
  const flagPostMutation = useFlagAdminPost()
  const unflagPostMutation = useUnflagAdminPost()

  const posts = data?.posts ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest mb-1 block">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setDebouncedSearch(search), setPage(1))}
                placeholder="Search post content..."
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 pl-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary placeholder-gray-400"
              />
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft/Flagged</option>
            </select>
          </div>
          <button
            onClick={() => { setDebouncedSearch(search); setPage(1) }}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-geist font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Search
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-geist font-semibold transition-colors cursor-pointer border",
              showComments
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50"
            )}
          >
            <MessageSquare size={14} className="inline mr-1" />
            {showComments ? "Show Posts" : "Manage Comments"}
          </button>
        </div>
      </div>

      {showComments ? (
        /* Comments section - placeholder for now, integrated with existing system */
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
          <MessageSquare size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-geist font-bold">Comment Management</p>
          <p className="text-xs text-gray-400 mt-1">Use the Reports tab to find and delete comments reported by users, or use the API directly.</p>
        </div>
      ) : (
        /* Posts Table */
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-geist font-bold">No posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider font-geist bg-gray-50/20">
                    <th className="px-5 py-3.5">Content</th>
                    <th className="px-5 py-3.5">Author</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Reports</th>
                    <th className="px-5 py-3.5">Engagement</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {posts.map((post: AdminPost) => (
                    <tr key={post.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-850/30 transition-colors text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="truncate">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {post.title || "Untitled"}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {post.content?.substring(0, 100)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium">{post.author.name || post.author.username}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-semibold font-geist",
                          post.status === "PUBLISHED"
                            ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/40"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/40"
                        )}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-xs font-mono",
                          post._count.reports > 0 ? "text-red-600 font-semibold" : "text-gray-400"
                        )}>
                          {post._count.reports}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        💬 {post._count.comments} · ⬆ {post._count.votes}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/post/${post.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View post"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {post.status === "PUBLISHED" ? (
                            <button
                              onClick={() => {
                                const reason = prompt("Reason for flagging this post:")
                                if (reason !== null) flagPostMutation.mutate({ id: post.id, reason: reason || undefined }, {
                                  onError: () => alert("Failed to flag post. Please try again.")
                                })
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                              title="Flag post"
                            >
                              <Flag size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm("Unflag this post? It will be republished.")) unflagPostMutation.mutate(post.id, {
                                  onError: () => alert("Failed to unflag post. Please try again.")
                                })
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors cursor-pointer"
                              title="Unflag post"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Delete this post permanently?")) deletePostMutation.mutate(post.id, {
                                onError: () => alert("Failed to delete post. Please try again.")
                              })
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            title="Delete post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} ({data?.total ?? 0} total)</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
