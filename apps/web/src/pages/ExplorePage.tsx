import { Search, Volume2 } from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { FeedCard } from "../components/feed/FeedCard"
import { Tag } from "../components/ui/Tag"
import { ScholarsWidget } from "../components/widgets/ScholarsWidget"
import { EventsWidget } from "../components/widgets/EventsWidget"

const trendingTags = [
  "#STA201", "#Rstats", "#DataScience", "#BayesianInference",
]

const posts = [
  {
    id: "e1",
    author: { name: "Dept. of Mathematics", handle: "@math_dept" },
    departmentTag: undefined,
    departmentName: "Official Announcement · 2h ago",
    timestamp: "",
    content:
      "The annual departmental seminar on Applied Topology has been rescheduled to Room 402 this Thursday. Guest speaker Dr. Aris will be presenting early findings on multi-dimensional data clustering.",
    stats: { likes: 124, comments: 18 },
    variant: "announcement" as const,
  },
  {
    id: "e2",
    author: { name: "Dr. Elias Thorne", handle: "@eliast_ml" },
    departmentTag: undefined,
    departmentName: "Postdoctoral Researcher · 5h ago",
    timestamp: "",
    content:
      "Working on a new approach to estimating the posterior predictive distribution for the hierarchical model we discussed last week. The integration step is proving challenging, but reformulating it seems promising:",
    latex: "P(\\tilde{y} | y) = \\int P(\\tilde{y} | \\theta) P(\\theta | y) d\\theta",
    stats: { likes: 89, comments: 32 },
    variant: "discussion" as const,
  },
]

export function ExplorePage() {
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
              className="w-full h-10 pl-10 pr-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <h2 className="text-title-md font-geist font-semibold text-on-surface mb-2">
              Trending in Statistics
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Tag key={tag} variant="trending">
                  {tag}
                </Tag>
              ))}
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

          <div className="space-y-4">
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                author={post.author}
                departmentName={post.departmentName}
                timestamp={post.timestamp}
                content={post.content}
                latex={post.latex}
                stats={post.stats}
                variant={post.variant}
              />
            ))}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2">
          <ScholarsWidget />
          <EventsWidget />
        </aside>
      </div>
    </div>
  )
}
