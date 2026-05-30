import { useState } from "react"
import { Sidebar } from "../components/layout/Sidebar"
import { PostComposer } from "../components/feed/PostComposer"
import { FeedTabs } from "../components/feed/FeedTabs"
import { FeedCard } from "../components/feed/FeedCard"
import { TrendingWidget } from "../components/widgets/TrendingWidget"
import { ScholarsWidget } from "../components/widgets/ScholarsWidget"
import { usePosts } from "../services/posts"
import { formatDistanceToNow } from "../lib/utils"
import { useAuth } from "../contexts/AuthContext"

const tabs = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
]

function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="flex gap-5 pt-3 border-t border-gray-100">
            <div className="w-12 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("for-you")
  
  // Fetch posts. If activeTab is "following", pass user.id to query only followed posts
  const { data, isLoading, error } = usePosts(
    1, 
    20, 
    activeTab === "following" ? user?.id : undefined
  )

  const posts = data?.posts || []

  return (
    <div className="min-h-screen bg-white pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-4">
          <PostComposer />

          <FeedTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          {isLoading ? (
            <FeedSkeleton />
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200/80 p-8">
              <p className="text-red-500 font-geist font-medium">Failed to load feed posts.</p>
              <p className="text-gray-400 text-sm mt-1">
                {error instanceof Error ? error.message : "Please try again later."}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200/80 p-8">
              <p className="text-gray-500 font-geist font-medium">
                {activeTab === "following" ? "No posts from followed scholars yet." : "No posts available yet."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === "following" 
                  ? "Follow other scholars on For You to view their updates here!" 
                  : "Be the first to share an update or question!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
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
                    }}
                    variant={variant}
                    event={post.event}
                    poll={post.poll}
                  />
                )
              })}
            </div>
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2">
          <TrendingWidget />
          <ScholarsWidget />
        </aside>
      </div>
    </div>
  )
}
