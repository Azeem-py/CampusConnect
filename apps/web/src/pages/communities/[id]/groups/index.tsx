import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useCommunityGroups, useCommunity } from "../../../../services/communities"
import { GroupCard } from "./GroupCard"
import { CreateGroupDialog } from "./CreateGroupDialog"
import { Users, Plus, Search } from "lucide-react"

export function CommunityGroupsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: community } = useCommunity(id!)
  const { data: groups, isLoading } = useCommunityGroups(id!)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")

  const canCreate = community?.membership === "OWNER" || community?.membership === "ADMIN" || community?.membership === "MODERATOR"

  const filtered = useMemo(() => {
    if (!groups) return []
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    )
  }, [groups, search])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-md font-geist font-semibold text-on-surface">Groups ({groups?.length ?? 0})</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Create Group
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full h-10 pl-9 pr-3 bg-surface-container border border-outline-variant/20 rounded-xl text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex flex-col items-center gap-2 p-5 bg-surface-container-lowest border border-outline-variant/15 rounded-xl">
              <div className="w-20 h-20 bg-surface-container-high rounded-full" />
              <div className="h-4 bg-surface-container-high rounded w-2/3" />
              <div className="h-3 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
          <Users size={36} className="mx-auto text-on-surface-variant/40 mb-3" />
          <p className="text-title-sm font-geist text-on-surface-variant">
            {search ? "No groups match your search" : "No groups yet"}
          </p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1">
            {search
              ? "Try a different search term."
              : canCreate
                ? "Create the first group for this community!"
                : "Groups created by moderators will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} communityId={id!} />
          ))}
        </div>
      )}

      {canCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-6 right-6 sm:hidden z-40 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
          aria-label="Create Group"
        >
          <Plus size={24} />
        </button>
      )}

      <CreateGroupDialog
        communityId={id!}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  )
}
