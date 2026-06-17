import { useParams, useNavigate, Link } from "react-router-dom"
import { Avatar } from "../../../../components/ui/Avatar"
import { useCommunityGroup, useUpdateGroup, useDeleteGroup, useJoinGroup, useLeaveGroup, useCommunity } from "../../../../services/communities"
import { uploadPublicFile } from "../../../../services/storage"
import { useState, useEffect, useRef } from "react"
import { GroupMembersSection } from "./[groupId]/group-members"
import { GroupInfoTab } from "./GroupInfoTab"
import { ArrowLeft, Edit3, Trash2, Users, LogOut, ClipboardList, MoreVertical, Camera } from "lucide-react"

type Tab = "about" | "members" | "quizzes"

export function GroupDetailPage() {
  const { id: communityId, groupId } = useParams<{ id: string; groupId: string }>()
  const navigate = useNavigate()
  const { data: community } = useCommunity(communityId!)
  const { data: group, isLoading } = useCommunityGroup(communityId!, groupId!)
  const updateGroup = useUpdateGroup(communityId!, groupId!)
  const deleteGroup = useDeleteGroup(communityId!)
  const joinGroup = useJoinGroup(communityId!, groupId!)
  const leaveGroup = useLeaveGroup(communityId!, groupId!)

  const [activeTab, setActiveTab] = useState<Tab>("about")
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editInit, setEditInit] = useState(false)
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  if (group && !editInit) {
    setEditName(group.name)
    setEditDescription(group.description ?? "")
    setEditInit(true)
  }

  if (isLoading || !group) {
    return <div className="text-center py-12 text-on-surface-variant">Loading...</div>
  }

  const canManage = group.membership === "MODERATOR" || community?.membership === "ADMIN" || community?.membership === "OWNER"
  const canDelete = community?.membership === "ADMIN" || community?.membership === "OWNER"
  const isMember = !!group.membership

  const tabs: { key: Tab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "members", label: `Members (${group._count.members})` },
    { key: "quizzes", label: "Quizzes" },
  ]

  const handleSaveEdit = async () => {
    let avatarUrl: string | undefined = editAvatarPreview || undefined

    const isDev = import.meta.env.DEV
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

    if (!isDev && isSupabaseConfigured && editAvatarFile) {
      avatarUrl = await uploadPublicFile("avatars", editAvatarFile)
    }

    await updateGroup.mutateAsync({
      name: editName,
      description: editDescription,
      ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
    })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete "${group.name}"?`)) {
      await deleteGroup.mutateAsync(groupId!)
      navigate(`/communities/${communityId}/groups`)
    }
  }

  const handleJoin = async () => {
    await joinGroup.mutateAsync()
  }

  const handleLeave = async () => {
    await leaveGroup.mutateAsync()
  }

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-4 px-4 bg-surface/95 backdrop-blur-md border-b border-outline-variant/10 mb-4">
        <div className="flex items-center justify-between h-12">
          <Link
            to={`/communities/${communityId}/groups`}
            className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={14} />
            Groups
          </Link>

          <div className="flex items-center gap-2">
            {!isMember ? (
              <button
                onClick={handleJoin}
                disabled={joinGroup.isPending}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {joinGroup.isPending ? "Joining..." : "Join"}
              </button>
            ) : (
              <button
                onClick={handleLeave}
                disabled={leaveGroup.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/40 text-on-surface-variant rounded-lg text-label-sm font-geist font-medium hover:bg-error-container/10 hover:text-error disabled:opacity-50 transition-colors"
              >
                <LogOut size={14} />
                Leave
              </button>
            )}

            {(canManage || canDelete) && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  aria-label="More actions"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-surface-container-lowest border border-outline-variant/15 rounded-xl shadow-lg overflow-hidden z-50">
                    {canManage && (
                      <button
                        onClick={() => { setShowEdit(true); setShowMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <Edit3 size={14} />
                        Edit Group
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { setShowDelete(true); setShowMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-error hover:bg-error-container/10 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete Group
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5 mb-4">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
          <Avatar
            src={group.avatar || undefined}
            name={group.name}
            size="xl"
            className="ring-2 ring-outline-variant/10 shrink-0"
          />
          <div>
            <h2 className="text-title-lg font-geist font-bold text-on-surface">{group.name}</h2>
            {group.description && (
              <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">{group.description}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5 text-label-sm text-on-surface-variant/60">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {group._count.members} {group._count.members === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-outline-variant/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-2.5 py-1.5 text-label-xs font-geist whitespace-nowrap border-b-2 transition-colors -mb-px text-on-surface-variant/70 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "about" && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5">
          <GroupInfoTab group={group} />
        </div>
      )}

      {activeTab === "members" && (
        <GroupMembersSection communityId={communityId!} groupId={groupId!} canManage={canManage} />
      )}

      {activeTab === "quizzes" && (
        <Link
          to={`/communities/${communityId}/groups/${groupId}/quizzes`}
          className="block bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-title-md font-geist font-semibold text-on-surface">Quizzes</h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">Create and take quizzes for this group</p>
            </div>
          </div>
        </Link>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
              <h2 className="text-headline-sm font-geist font-semibold text-on-surface">Edit Group</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <ArrowLeft size={18} className="rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4">
              <div className="flex justify-center">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high cursor-pointer border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors flex items-center justify-center group"
                  onClick={() => document.getElementById("edit-group-avatar-input")?.click()}
                >
                  {(editAvatarPreview || group.avatar) ? (
                    <img
                      src={editAvatarPreview || group.avatar || ""}
                      alt="Group avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={20} className="text-on-surface-variant/50 group-hover:text-primary/60 transition-colors" />
                  )}
                  <input
                    id="edit-group-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setEditAvatarFile(file)
                      const reader = new FileReader()
                      reader.onload = () => setEditAvatarPreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-geist font-medium text-on-surface mb-1.5">Group Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-sm font-geist font-medium text-on-surface mb-1.5">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowEdit(false)}
                  className="flex-1 h-10 bg-surface-container text-on-surface rounded-lg text-label-sm font-geist font-medium hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateGroup.isPending || !editName.trim()}
                  className="flex-1 h-10 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {updateGroup.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 w-full max-w-sm p-6">
            <h2 className="text-title-md font-geist font-semibold text-on-surface mb-2">Delete Group</h2>
            <p className="text-body-md text-on-surface-variant mb-5">
              Are you sure you want to delete <strong>"{group.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 h-10 bg-surface-container text-on-surface rounded-lg text-label-sm font-geist font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteGroup.isPending}
                className="flex-1 h-10 bg-error text-on-error rounded-lg text-label-sm font-geist font-medium hover:brightness-110 disabled:opacity-50 transition-colors"
              >
                {deleteGroup.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
