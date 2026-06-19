import { useState } from "react"
import { Link } from "react-router-dom"
import { Sidebar } from "../../components/layout/Sidebar"
import { Avatar } from "../../components/ui/Avatar"
import { useCommunities, useMyCommunities } from "../../services/communities"
import { Users, Plus, Search, Hash, ExternalLink } from "lucide-react"

export function CommunitiesPage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"discover" | "mine">("discover")
  const { data: discoverData, isLoading: discoverLoading } = useCommunities(undefined, search || undefined)
  const { data: myCommunities, isLoading: mineLoading } = useMyCommunities()

  const isLoading = tab === "discover" ? discoverLoading : mineLoading
  const communities = tab === "discover" ? discoverData?.communities ?? [] : myCommunities ?? []

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-title-lg font-geist font-bold text-on-surface">Communities</h1>
            <Link
              to="/communities/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Create
            </Link>
          </div>

          <div className="flex gap-1 p-1 bg-surface-container rounded-lg w-fit">
            <button
              onClick={() => setTab("discover")}
              className={`px-4 py-1.5 rounded-md text-label-sm font-geist font-medium transition-colors ${
                tab === "discover"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-1.5 rounded-md text-label-sm font-geist font-medium transition-colors ${
                tab === "mine"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              My Communities
            </button>
          </div>

          {tab === "discover" && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-surface-container-high rounded w-1/3" />
                      <div className="h-4 bg-surface-container-high rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
              <Users size={40} className="mx-auto text-on-surface-variant/40 mb-3" />
              <p className="text-title-sm font-geist text-on-surface-variant">
                {tab === "mine" ? "No communities yet" : "No communities found"}
              </p>
              <p className="text-body-sm text-on-surface-variant/60 mt-1">
                {tab === "mine" ? "Join a community or create your own!" : "Try a different search term."}
              </p>
              {tab === "mine" && (
                <Link
                  to="/communities/create"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus size={16} />
                  Create Community
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  to={`/communities/${c.id}`}
                  className="block bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={c.avatar || undefined}
                      name={c.name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-title-sm font-geist font-semibold text-on-surface truncate">{c.name}</h3>
                        {c.membership && (
                          <span className="text-label-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize shrink-0">
                            {c.membership.toLowerCase()}
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">{c.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-label-sm text-on-surface-variant/60">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {c._count.members}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {c._count.groups} groups
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                          <ExternalLink size={12} />
                          View
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0" />
      </div>
    </div>
  )
}
