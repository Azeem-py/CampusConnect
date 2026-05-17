import { useState } from "react"
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal } from "lucide-react"
import { Avatar } from "../ui/Avatar"
import { Tag } from "../ui/Tag"
import { LaTeXBlock } from "./LaTeXBlock"
import { cn } from "../../lib/utils"

interface FeedCardProps {
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

function getAvatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&bold=true&font-size=0.4&format=png`
}

export function FeedCard({
  author,
  departmentTag,
  departmentName,
  timestamp,
  content,
  latex,
  stats: initialStats,
  variant = "default",
}: FeedCardProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [likes, setLikes] = useState(initialStats.likes)
  const [shares, setShares] = useState(initialStats.shares ?? 0)

  function handleLike() {
    setLiked((p) => {
      setLikes((c) => c + (p ? -1 : 1))
      return !p
    })
  }

  function handleRepost() {
    setReposted((p) => {
      setShares((c) => c + (p ? -1 : 1))
      return !p
    })
  }

  function handleBookmark() {
    setBookmarked((p) => !p)
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-gray-300/80 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={author.name} src={author.avatar || getAvatarUrl(author.name)} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-geist font-semibold text-[15px] text-gray-900">
                {author.name}
              </span>
              {departmentTag && (
                <Tag variant="department">{departmentTag}</Tag>
              )}
            </div>
            <span className="text-[13px] text-gray-500 font-inter">
              {author.handle} · {timestamp}
            </span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {departmentName && (
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-geist">
          {departmentTag && variant !== "default" && (
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-semibold",
                variant === "announcement"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              )}
            >
              {variant === "announcement"
                ? "Official Announcement"
                : "Discussion"}
            </span>
          )}
          <span>{departmentName}</span>
        </div>
      )}

      {content && (
        <p className="text-[14px] text-gray-800 font-inter leading-relaxed">
          {content}
        </p>
      )}

      {latex && <LaTeXBlock>{latex}</LaTeXBlock>}

      <div className="flex items-center gap-5 pt-1 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5",
            liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
          )}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          {likes}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] font-geist text-gray-400 hover:text-blue-500 transition-colors py-1.5">
          <MessageCircle size={16} />
          {initialStats.comments}
        </button>
        <button
          onClick={handleRepost}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5",
            reposted ? "text-green-600" : "text-gray-400 hover:text-green-600"
          )}
        >
          <Repeat2 size={16} />
          {shares}
        </button>
        <button
          onClick={handleBookmark}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5 ml-auto",
            bookmarked ? "text-blue-600" : "text-gray-400 hover:text-blue-600"
          )}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}
