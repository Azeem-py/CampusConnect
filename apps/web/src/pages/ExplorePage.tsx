import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Volume2 } from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { FeedCard } from "../components/feed/FeedCard"
import { Tag } from "../components/ui/Tag"
import { ScholarsWidget } from "../components/widgets/ScholarsWidget"
import { EventsWidget } from "../components/widgets/EventsWidget"
import { usePosts, useTrendingTopics } from "../services/posts"
import { formatDistanceToNow } from "../lib/utils"

function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((n) => (
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
          </div>
          <div className="flex gap-5 pt-3 border-t border-gray-100">
            <div className="w-12 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") || "")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "")
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading, error } = usePosts(1, 20, undefined, debouncedSearchQuery)
  const { data: trendingTopics = [] } = useTrendingTopics()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    setSearchParams(val ? { query: val } : {})
  }

  const trendingTags = trendingTopics.slice(0, 5).map((t) => t.label)
  const posts = data?.posts || []

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search topics, departments, scholars..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 pl-10 pr-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <h2 className="text-title-md font-geist font-semibold text-on-surface mb-2">
              Trending Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant font-inter italic">No active tags.</p>
              ) : (
                trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag)
                      setSearchParams({ query: tag })
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <Tag variant="trending">
                      {tag}
                    </Tag>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-geist font-semibold text-on-surface flex items-center gap-2">
              <Volume2 size={16} className="text-primary" />
              Campus Buzz
            </h2>
            <button className="text-label-md text-primary font-geist hover:underline">
              View All
            </button>
          </div>

          {isLoading ? (
            <FeedSkeleton />
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200/80 p-8">
              <p className="text-red-500 font-geist font-medium">Failed to load posts.</p>
              <p className="text-gray-400 text-sm mt-1">
                {error instanceof Error ? error.message : "Please try again later."}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200/80 p-8">
              <p className="text-gray-500 font-geist font-medium">No results found.</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                      shares: post._count.reposts,
                    }}
                    variant={variant}
                    event={post.event}
                    poll={post.poll}
                    votes={post.votes}
                    originalPost={post.originalPost}
                    originalPostId={post.originalPostId}
                  />
                )
              })}
            </div>
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ScholarsWidget />
          <EventsWidget />
        </aside>
      </div>
    </div>
  )
}
