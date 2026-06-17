import { useState } from "react"
import { Avatar } from "../../../../../components/ui/Avatar"
import {
  useGroupMembers,
  useAddGroupMember,
  useUpdateGroupMemberRole,
  useRemoveGroupMember,
} from "../../../../../services/communities"
import type { GroupMemberRole } from "../../../../../services/communities"
import { Shield, ShieldOff, UserMinus, Plus } from "lucide-react"

interface Props {
  communityId: string
  groupId: string
  canManage: boolean
}

export function GroupMembersSection({ communityId, groupId, canManage }: Props) {
  const { data: membersData, isLoading } = useGroupMembers(communityId, groupId)
  const addMember = useAddGroupMember(communityId, groupId)
  const updateRole = useUpdateGroupMemberRole(communityId, groupId)
  const removeMember = useRemoveGroupMember(communityId, groupId)
  const [addUserId, setAddUserId] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const members = membersData?.members ?? []

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUserId.trim()) return
    await addMember.mutateAsync({ userId: addUserId })
    setAddUserId("")
    setShowAdd(false)
  }

  const handleToggleRole = async (memberId: string, currentRole: GroupMemberRole) => {
    const newRole = currentRole === "MODERATOR" ? "MEMBER" : "MODERATOR"
    await updateRole.mutateAsync({ memberId, role: newRole })
  }

  const handleRemove = async (memberId: string) => {
    if (window.confirm("Remove this member from the group?")) {
      await removeMember.mutateAsync(memberId)
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-sm font-geist font-semibold text-on-surface">Members ({membersData?.total ?? 0})</h3>
        {canManage && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {canManage && showAdd && (
        <form onSubmit={handleAddMember} className="flex gap-2 mb-4 p-3 bg-surface-container rounded-xl">
          <input
            type="text"
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            placeholder="Enter user ID..."
            className="flex-1 h-9 px-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={addMember.isPending || !addUserId.trim()}
            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addMember.isPending ? "..." : "Add"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 p-2.5 rounded-lg">
              <div className="w-9 h-9 bg-surface-container-high rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-surface-container-high rounded w-1/3" />
                <div className="h-3 bg-surface-container-high rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-center py-8 text-on-surface-variant text-body-sm">No members in this group</p>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={member.user.avatar || undefined}
                  name={member.user.name || member.user.username}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-medium text-on-surface truncate">
                      {member.user.name || member.user.username}
                    </p>
                    <span className={`text-label-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      member.role === "MODERATOR"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {member.role === "MODERATOR" ? "Mod" : "Member"}
                    </span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant/60 truncate">@{member.user.username}</p>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleRole(member.id, member.role)}
                    disabled={updateRole.isPending}
                    className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-colors"
                    title={member.role === "MODERATOR" ? "Demote to member" : "Promote to moderator"}
                  >
                    {member.role === "MODERATOR" ? <ShieldOff size={14} /> : <Shield size={14} />}
                  </button>
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removeMember.isPending}
                    className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error-container/10 transition-colors"
                    title="Remove from group"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
