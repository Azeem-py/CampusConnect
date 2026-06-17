import { useState } from "react"
import { useAdminUsers, useDisableAdminUser, useFlagAdminUser, useDeleteAdminUser, useUpdateAdminUser } from "../../services/admin"
import type { AdminUser } from "@campus-connect/types"
import { Loader2, Search, ChevronLeft, ChevronRight, MoreHorizontal, Ban, Flag, Trash2, UserX, RotateCcw } from "lucide-react"
import { cn } from "../../lib/utils"

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [editModal, setEditModal] = useState<{ id: string; name: string; username: string; email: string; department: string; school: string } | null>(null)

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  })

  const disableMutation = useDisableAdminUser()
  const flagMutation = useFlagAdminUser()
  const deleteMutation = useDeleteAdminUser()
  const updateMutation = useUpdateAdminUser()

  const handleSearch = () => {
    setPage(1)
    setDebouncedSearch(search)
  }

  const users = data?.users ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold font-geist text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 block">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, username, or email..."
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 pl-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all placeholder-gray-400"
              />
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold font-geist text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 block">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="BUSINESS">Business</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold font-geist text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="deactivated">Disabled</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-geist font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-geist bg-gray-50/20">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">School / Dept</th>
                  <th className="px-5 py-3.5">Rep</th>
                  <th className="px-5 py-3.5">Posts</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((user: AdminUser) => (
                  <tr key={user.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-850/30 transition-colors text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name || "Unnamed"}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-semibold font-geist",
                        user.role === "ADMIN" && "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200/40",
                        user.role === "BUSINESS" && "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40",
                        user.role === "STUDENT" && "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/40",
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {user.school && <p>{user.school}</p>}
                      {user.department && <p className="text-gray-400">{user.department}</p>}
                      {!user.school && !user.department && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{user.reputationScore}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{user._count.posts}</td>
                    <td className="px-5 py-3.5">
                      {user.isDeactivated ? (
                        <span className="text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1">
                          <UserX size={12} /> Disabled
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-xs font-semibold">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditModal({
                            id: user.id,
                            name: user.name || "",
                            username: user.username,
                            email: user.email,
                            department: user.department || "",
                            school: user.school || "",
                          })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title="Edit user"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to ${user.isDeactivated ? "re-enable" : "disable"} this user?`)) {
                              disableMutation.mutate(user.id, {
                                onError: () => alert("Failed to update user status. Please try again.")
                              })
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                          title={user.isDeactivated ? "Re-enable user" : "Disable user"}
                        >
                          {user.isDeactivated ? <RotateCcw size={15} /> : <Ban size={15} />}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Reason for flagging this user:")
                            if (reason !== null) flagMutation.mutate({ id: user.id, reason: reason || undefined }, {
                              onError: () => alert("Failed to flag user. Please try again.")
                            })
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Flag user"
                        >
                          <Flag size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
                              deleteMutation.mutate(user.id, {
                                onError: () => alert("Failed to delete user. Please try again.")
                              })
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
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
          <p className="text-xs text-gray-400">
            Showing page {page} of {totalPages} ({data?.total ?? 0} total users)
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-geist font-bold text-lg text-on-surface mb-4">Edit User</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              await updateMutation.mutateAsync({
                id: editModal.id,
                data: {
                  name: editModal.name,
                  username: editModal.username,
                  email: editModal.email,
                  department: editModal.department || undefined,
                  school: editModal.school || undefined,
                },
              })
              setEditModal(null)
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Username</label>
                <input
                  type="text"
                  value={editModal.username}
                  onChange={(e) => setEditModal({ ...editModal, username: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editModal.email}
                  onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">School</label>
                  <input
                    type="text"
                    value={editModal.school}
                    onChange={(e) => setEditModal({ ...editModal, school: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Department</label>
                  <input
                    type="text"
                    value={editModal.department}
                    onChange={(e) => setEditModal({ ...editModal, department: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
