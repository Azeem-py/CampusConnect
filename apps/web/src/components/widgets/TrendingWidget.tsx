import { TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTrendingTopics } from "../../services/posts"

export function TrendingWidget() {
  const { data: topics = [], isLoading } = useTrendingTopics()
  const navigate = useNavigate()

  const handleTopicClick = (label: string) => {
    navigate(`/explore?query=${encodeURIComponent(label)}`)
  }

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-4">
        <h3 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface mb-3">
          <TrendingUp size={16} className="text-primary" />
          Trending Topics
        </h3>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface mb-3">
        <TrendingUp size={16} className="text-primary" />
        Trending Topics
      </h3>
      <div className="space-y-3">
        {topics.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant font-inter italic">No trending topics active.</p>
        ) : (
          topics.slice(0, 5).map((topic) => (
            <button
              key={topic.label}
              onClick={() => handleTopicClick(topic.label)}
              className="w-full text-left group cursor-pointer block focus:outline-none"
            >
              <p className="text-label-sm text-on-surface-variant font-inter">{topic.category}</p>
              <p className="text-title-sm font-geist font-medium text-on-surface group-hover:text-primary transition-colors">
                {topic.label}
              </p>
              <p className="text-body-sm text-on-surface-variant font-inter">{topic.posts}</p>
            </button>
          ))
        )}
      </div>
      <button 
        onClick={() => navigate('/explore')}
        className="mt-3 text-label-md text-primary font-geist hover:underline cursor-pointer block text-left"
      >
        Show more
      </button>
    </div>
  )
}
