import { useParams, Link, Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "../../../components/layout/Sidebar"
import { Avatar } from "../../../components/ui/Avatar"
import { useCommunity, useJoinCommunity, useLeaveCommunity, useMyCommunities } from "../../../services/communities"
import { useAuth } from "../../../contexts/AuthContext"
import { usePosts } from "../../../services/posts"
import { FeedCard } from "../../../components/feed/FeedCard"
import { formatDistanceToNow } from "../../../lib/utils"
import { Plus, Users, LogOut } from "lucide-react"

export function CommunityLayout() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const { data: community, isLoading, error } = useCommunity(id!)
  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()
  const { refetch: refetchMyCommunities } = useMyCommunities()

  const { data: communityPosts, isLoading: postsLoading } = usePosts(1, 20, undefined, undefined, 'latest', 'all', id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface pb-16 lg:pb-0">
        <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
          <Sidebar />
          <main className="flex-1 max-w-[600px] min-w-0">
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </main>
          <aside className="hidden xl:flex flex-col w-72 shrink-0" />
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-surface pb-16 lg:pb-0">
        <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
          <Sidebar />
          <main className="flex-1 max-w-[600px] min-w-0">
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-on-surface-variant">Community not found</p>
              <Link to="/communities" className="text-primary hover:underline">Back to communities</Link>
            </div>
          </main>
          <aside className="hidden xl:flex flex-col w-72 shrink-0" />
        </div>
      </div>
    )
  }

  const isOwner = community.ownerId === user?.id
  const isAdmin = community.membership === "ADMIN" || isOwner
  const isMember = !!community.membership

  const handleJoin = async () => {
    const result = await joinCommunity.mutateAsync(id!)
    if (result.joined) {
      refetchMyCommunities()
    }
  }

  const handleLeave = async () => {
    await leaveCommunity.mutateAsync(id!)
    refetchMyCommunities()
  }

  const tabs = [
    { label: "Feed", path: `/communities/${id}` },
    { label: "Members", path: `/communities/${id}/members` },
    ...(isAdmin ? [{ label: "Requests", path: `/communities/${id}/requests` }] : []),
    { label: "Groups", path: `/communities/${id}/groups` },
    ...(isAdmin ? [{ label: "Settings", path: `/communities/${id}/settings` }] : []),
  ]

  const isRoot = location.pathname === `/communities/${id}`

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl overflow-hidden mb-4">
            {community.banner && (
              <div className="h-32 sm:h-40 overflow-hidden">
                <img
                  src={community.banner}
                  alt={`${community.name} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={community.banner ? "px-5 pb-4" : "p-5"}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={community.avatar || undefined}
                    name={community.name}
                    size="lg"
                    className="ring-2 ring-surface-container-lowest"
                  />
                  <div>
                    <h1 className="text-title-lg font-geist font-bold text-on-surface">{community.name}</h1>
                    <p className="text-body-sm text-on-surface-variant">
                      {community._count.members} members · {community._count.groups} groups
                    </p>
                    {community.institution && (
                      <p className="text-label-sm text-on-surface-variant/60 mt-0.5">{community.institution.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!isMember ? (
                    <button
                      onClick={handleJoin}
                      disabled={joinCommunity.isPending}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {joinCommunity.isPending ? "Joining..." : "Join"}
                    </button>
                  ) : (
                    <>
                      {!isOwner && (
                        <button
                          onClick={handleLeave}
                          disabled={leaveCommunity.isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-outline-variant/40 text-on-surface-variant rounded-lg text-label-md font-geist font-medium hover:bg-error-container/10 hover:text-error disabled:opacity-50 transition-colors"
                        >
                          <LogOut size={14} />
                          Leave
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {community.description && (
                <p className="text-body-md text-on-surface-variant mb-4">{community.description}</p>
              )}

              <div className="flex items-center gap-1">
                {tabs.map((tab) => {
                  const isActive = location.pathname === tab.path || (tab.label === "Feed" && isRoot)
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={`px-4 py-2 text-label-md font-geist font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {isRoot ? (
            <div className="space-y-4">
              {isMember ? (
                <Link
                  to={`/create?communityId=${id}`}
                  className="block bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-3 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user?.avatar || undefined}
                      name={user?.name || "U"}
                      size="sm"
                    />
                    <div className="flex-1 h-9 px-3 flex items-center text-body-md text-on-surface-variant/50 font-inter">
                      Post to {community.name}...
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium">
                      <Plus size={14} />
                      Post
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-6 text-center">
                  <Users size={32} className="mx-auto text-on-surface-variant/30 mb-2" />
                  <p className="text-body-sm text-on-surface-variant">Join this community to post and participate.</p>
                </div>
              )}

              {postsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-container-high rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 bg-surface-container-high rounded w-1/3" />
                          <div className="h-3 bg-surface-container-high rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-surface-container-high rounded w-full" />
                        <div className="h-4 bg-surface-container-high rounded w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !communityPosts || communityPosts.posts.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
                  <Users size={36} className="mx-auto text-on-surface-variant/40 mb-3" />
                  <p className="text-title-sm font-geist text-on-surface-variant">No posts yet</p>
                  <p className="text-body-sm text-on-surface-variant/60 mt-1">
                    {isMember ? "Be the first to share in this community!" : "Posts will appear here once shared."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityPosts.posts.map((post) => {
                    const variant = post.event ? "announcement" : post.poll ? "discussion" : "default"
                    return (
                      <FeedCard
                        key={post.id}
                        id={post.id}
                        author={{
                          id: post.author.id,
                          name: post.author.name || "Anonymous",
                          handle: `@${post.author.username}`,
                          avatar: post.author.avatar || undefined,
                        }}
                        departmentTag={post.courseCode || undefined}
                        departmentName={undefined}
                        timestamp={formatDistanceToNow(post.createdAt)}
                        content={post.content}
                        stats={{
                          likes: post._count.votes,
                          comments: post._count.comments,
                          shares: post._count.reposts,
                        }}
                        variant={variant}
                        event={post.event}
                        poll={post.poll}
                        votes={post.votes}
                        images={post.images}
                        tags={post.tags}
                        originalPost={post.originalPost}
                        originalPostId={post.originalPostId}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0" />
      </div>
    </div>
  )
}
