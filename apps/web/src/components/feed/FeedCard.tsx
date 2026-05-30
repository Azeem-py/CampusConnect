import { useState } from "react"
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, Calendar, Vote as VoteIcon, Check } from "lucide-react"
import { Avatar } from "../ui/Avatar"
import { Tag } from "../ui/Tag"
import { cn } from "../../lib/utils"
import { renderEnhancedPreview } from "../../lib/latex"
import { useVotePoll, type PostEvent, type PostPoll } from "../../services/posts"
import { useAuth } from "../../contexts/AuthContext"
import { useFollowUser, useUnfollowUser } from "../../services/auth"

interface FeedCardProps {
  id?: string
  author: {
    id?: string
    name: string
    handle: string
    avatar?: string
  }
  departmentTag?: string
  departmentName?: string
  timestamp: string
  content?: string
  stats: {
    likes: number
    comments: number
    shares?: number
  }
  variant?: "default" | "announcement" | "discussion"
  event?: PostEvent | null
  poll?: PostPoll | null
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
  stats: initialStats,
  variant = "default",
  event,
  poll,
}: FeedCardProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [likes, setLikes] = useState(initialStats.likes)
  const [shares, setShares] = useState(initialStats.shares ?? 0)

  // Followers & Following state
  const { user: currentUser } = useAuth()
  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()

  const isSelf = currentUser?.id === author.id
  const isFollowing = currentUser?.following?.some((f: any) => f.id === author.id)

  const handleFollowToggle = () => {
    if (!author.id) return
    if (isFollowing) {
      unfollowUser.mutate(author.id)
    } else {
      followUser.mutate(author.id)
    }
  }

  // Interactive Poll Voting
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const votePoll = useVotePoll()

  const handleVote = (optionId: string) => {
    if (!poll) return
    votePoll.mutate(
      { pollId: poll.id, pollOptionId: optionId },
      {
        onSuccess: (data) => {
          setVotedOptionId(data.pollOptionId)
        },
      }
    )
  }

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
        <div className="flex items-center gap-2">
          {!isSelf && author.id && (
            <button
              onClick={handleFollowToggle}
              disabled={followUser.isPending || unfollowUser.isPending}
              className={cn(
                "px-3.5 py-1 text-[12px] font-geist font-semibold rounded-full transition-all duration-150 cursor-pointer select-none",
                isFollowing
                  ? "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <MoreHorizontal size={16} />
          </button>
        </div>
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
        <div className="text-[14px] text-gray-800 font-inter leading-relaxed whitespace-pre-wrap break-words">
          {renderEnhancedPreview(content)}
        </div>
      )}

      {/* Render Associated Event */}
      {event && (
        <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <div className="flex items-center gap-1.5 text-[11px] font-geist font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
            <Calendar size={13} />
            Event Details
          </div>
          <p className="text-[14px] font-geist font-semibold text-gray-900">{event.title}</p>
          <div className="mt-1 space-y-0.5 text-[12px] text-gray-600 font-inter">
            <p>
              📅 {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                hour: "numeric", minute: "2-digit"
              })}
            </p>
            {event.location && <p>📍 {event.location}</p>}
          </div>
          {event.description && (
            <p className="mt-1 text-[12px] text-gray-500 font-inter leading-relaxed">{event.description}</p>
          )}
        </div>
      )}

      {/* Render Associated Poll */}
      {poll && (() => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.votes, 0)
        return (
          <div className="mt-3 p-3.5 bg-amber-50/55 rounded-lg border border-amber-200/50 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-geist font-semibold text-amber-700 uppercase tracking-wide">
              <VoteIcon size={13} />
              Interactive Poll
            </div>
            <p className="text-[14px] font-geist font-medium text-gray-900 leading-snug">{poll.question}</p>
            <div className="space-y-2">
              {poll.options.map((option) => {
                const votesCount = option._count.votes + (votedOptionId === option.id ? 1 : 0)
                const finalTotal = totalVotes + (votedOptionId ? 1 : 0)
                const pct = finalTotal > 0 ? Math.round((votesCount / finalTotal) * 100) : 0
                const isSelected = votedOptionId === option.id

                return (
                  <button
                    key={option.id}
                    disabled={votePoll.isPending}
                    onClick={() => handleVote(option.id)}
                    className={cn(
                      "relative w-full text-left p-2.5 rounded-lg border border-amber-200/50 bg-white font-inter text-[13px] text-gray-800 transition-all duration-200 overflow-hidden flex items-center justify-between",
                      isSelected ? "border-amber-500 ring-1 ring-amber-500" : "hover:border-amber-400"
                    )}
                  >
                    {/* Background Progress Fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-amber-100/60 transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                    
                    {/* Content */}
                    <span className="relative z-10 font-medium flex items-center gap-2">
                      {isSelected && <Check size={14} className="text-amber-700 stroke-[3]" />}
                      {option.text}
                    </span>
                    <span className="relative z-10 text-[12px] font-semibold text-amber-800 font-mono">
                      {pct}% ({votesCount})
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="text-[11px] text-amber-700/80 font-geist text-right italic font-medium">
              Total: {totalVotes + (votedOptionId ? 1 : 0)} votes
            </div>
          </div>
        )
      })()}

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
