import { TrendingUp } from "lucide-react"

interface TrendingTopic {
  category: string
  label: string
  posts: string
}

const topics: TrendingTopic[] = [
  { category: "Physics · Trending", label: "#QuantumComputing", posts: "12.4K Posts" },
  { category: "Mathematics · Exam Season", label: "#CalculusFinals", posts: "8,091 Posts" },
  { category: "Biology · New Paper", label: "CRISPR Advancements", posts: "5.2K Posts" },
]

export function TrendingWidget() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface mb-3">
        <TrendingUp size={16} className="text-primary" />
        Trending Topics
      </h3>
      <div className="space-y-3">
        {topics.map((topic) => (
          <button
            key={topic.label}
            className="w-full text-left group"
          >
            <p className="text-label-sm text-on-surface-variant font-inter">{topic.category}</p>
            <p className="text-title-sm font-geist font-medium text-on-surface group-hover:text-primary transition-colors">
              {topic.label}
            </p>
            <p className="text-body-sm text-on-surface-variant font-inter">{topic.posts}</p>
          </button>
        ))}
      </div>
      <button className="mt-2 text-label-md text-primary font-geist hover:underline">
        Show more
      </button>
    </div>
  )
}
