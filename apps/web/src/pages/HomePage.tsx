import { useState } from "react"
import { Sidebar } from "../components/layout/Sidebar"
import { PostComposer } from "../components/feed/PostComposer"
import { FeedTabs } from "../components/feed/FeedTabs"
import { FeedCard } from "../components/feed/FeedCard"
import { TrendingWidget } from "../components/widgets/TrendingWidget"
import { ScholarsWidget } from "../components/widgets/ScholarsWidget"

const tabs = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
]

interface Post {
  id: string
  author: {
    name: string
    handle: string
    avatar?: string
  }
  departmentTag?: string
  departmentName?: string
  timestamp: string
  content?: string
  latex?: string
  stats: {
    likes: number
    comments: number
    shares?: number
  }
  variant?: "default" | "announcement" | "discussion"
}

const initialPosts: Post[] = [
  {
    id: "1",
    author: { name: "Dr. Arthur Pendelton", handle: "@art_physics" },
    timestamp: "2h",
    content:
      "Finally managed to simplify the boundary conditions for the new topological model. The resulting Hamiltonian matrix reduces beautifully when we apply the constraints:",
    latex: `\\mathcal{H}(\\mathbf{k}) = \\sum_{i=1}^3 d_i(\\mathbf{k})\\sigma_i + \\epsilon_0(\\mathbf{k})\\mathbb{I}\n\\text{where } d_i(\\mathbf{k}) \\text{ are the Pauli coefficients.}`,
    stats: { likes: 89, comments: 12, shares: 4 },
  },
  {
    id: "2",
    author: { name: "CompSci Dept", handle: "@stanford_cs" },
    departmentTag: "CS",
    departmentName: "Stanford University",
    timestamp: "5h",
    content:
      "Reminder: The midterm review session for Data Structures is moved to Turing Auditorium today at 18:00. We will focus heavily on dynamic programming patterns and graph traversals. Come prepared with questions!",
    stats: { likes: 45, comments: 3, shares: 12 },
    variant: "announcement" as const,
  },
  {
    id: "3",
    author: { name: "Dr. Elena Rostova", handle: "@erostova" },
    departmentTag: "COG-SCI",
    timestamp: "1h",
    content:
      "Fascinating results from our latest fMRI study on bilingual language processing. The dorsal stream shows significantly higher activation during syntactic ambiguity resolution in late bilinguals compared to early bilinguals.",
    stats: { likes: 156, comments: 23, shares: 18 },
  },
]

export function HomePage() {
  const [activeTab, setActiveTab] = useState("for-you")
  const [posts] = useState(initialPosts)

  return (
    <div className="min-h-screen bg-white pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-4">
          <PostComposer />

          <FeedTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="space-y-3">
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                author={post.author}
                departmentTag={post.departmentTag}
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
          <TrendingWidget />
          <ScholarsWidget />
        </aside>
      </div>
    </div>
  )
}
