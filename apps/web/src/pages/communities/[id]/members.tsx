import { useParams, useSearchParams } from "react-router-dom"
import { Avatar } from "../../../components/ui/Avatar"
import { useCommunityMembers, useUpdateMemberRole, useRemoveMember, useCommunity } from "../../../services/communities"
import type { CommunityMemberRole } from "../../../services/communities"
import { useAuth } from "../../../contexts/AuthContext"
import { Search, Shield, ShieldCheck, UserMinus, Star } from "lucide-react"
import { useState } from "react"

const roleLabels: Record<CommunityMemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  MEMBER: "Member",
}

const roleChip: Record<CommunityMemberRole, string> = {
  OWNER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-primary/10 text-primary",
  MODERATOR: "bg-tertiary-container/20 text-tertiary",
  MEMBER: "bg-surface-container text-on-surface-variant",
}

export function CommunityMembersPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: community } = useCommunity(id!)
  const roleFilter = (searchParams.get("role") || undefined) as CommunityMemberRole | undefined
  const { data, isLoading } = useCommunityMembers(id!, roleFilter)
  const updateRole = useUpdateMemberRole(id!)
  const removeMember = useRemoveMember(id!)
  const [searchQuery, setSearchQuery] = useState("")

  const members = data?.members ?? []

  const filteredMembers = searchQuery
    ? members.filter((m) =>
        (m.user.name || m.user.username).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members

  const isOwner = community?.ownerId === user?.id
  const isAdmin = community?.membership === "ADMIN" || isOwner

  const handleRoleChange = async (memberId: string, role: CommunityMemberRole) => {
    await updateRole.mutateAsync({ memberId, role })
  }

  const handleRemove = async (memberId: string) => {
    if (window.confirm("Remove this member?")) {
      await removeMember.mutateAsync(memberId)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-md font-geist font-semibold text-on-surface">Members ({data?.total ?? 0})</h2>
        <select
          value={roleFilter ?? ""}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams)
            if (e.target.value) params.set("role", e.target.value)
            else params.delete("role")
            setSearchParams(params)
          }}
          className="h-9 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-label-sm font-inter text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">All Roles</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="MODERATOR">Moderator</option>
          <option value="MEMBER">Member</option>
        </select>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-sm font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-lg">
              <div className="w-10 h-10 bg-surface-container-high rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-surface-container-high rounded w-1/4" />
                <div className="h-3 bg-surface-container-high rounded w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">No members found</p>
      ) : (
        <div className="space-y-1">
          {filteredMembers.map((member) => {
            const isOwnerBadge = member.role === "OWNER"
            const isAdminBadge = member.role === "ADMIN"
            const isModBadge = member.role === "MODERATOR"

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={member.user.avatar || undefined}
                    name={member.user.name || member.user.username}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-body-md font-medium text-on-surface">
                        {member.user.name || member.user.username}
                      </p>
                      {isOwnerBadge && <Star size={12} className="text-amber-500" />}
                      {isAdminBadge && <ShieldCheck size={12} className="text-primary" />}
                      {isModBadge && <Shield size={12} className="text-tertiary" />}
                    </div>
                    <p className="text-label-sm text-on-surface-variant">@{member.user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-label-sm px-2.5 py-0.5 rounded-full font-medium ${roleChip[member.role]}`}>
                    {roleLabels[member.role]}
                  </span>
                  {isAdmin && member.role !== "OWNER" && (
                    <div className="flex gap-1">
                      {member.role !== "ADMIN" && (
                        <button
                          onClick={() => handleRoleChange(member.id, "ADMIN")}
                          disabled={updateRole.isPending}
                          className="text-label-sm text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      {member.role !== "MODERATOR" && member.role !== "ADMIN" && (
                        <button
                          onClick={() => handleRoleChange(member.id, "MODERATOR")}
                          disabled={updateRole.isPending}
                          className="text-label-sm text-tertiary hover:bg-tertiary-container/20 px-2 py-1 rounded transition-colors"
                        >
                          Make Mod
                        </button>
                      )}
                      {member.role === "ADMIN" || member.role === "MODERATOR" ? (
                        <button
                          onClick={() => handleRoleChange(member.id, "MEMBER")}
                          disabled={updateRole.isPending}
                          className="text-label-sm text-on-surface-variant hover:bg-surface-container px-2 py-1 rounded transition-colors"
                        >
                          Demote
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removeMember.isPending}
                        className="text-label-sm text-error hover:bg-error-container/10 px-2 py-1 rounded transition-colors"
                        title="Remove member"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
