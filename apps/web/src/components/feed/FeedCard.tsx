import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, Calendar, Vote as VoteIcon, Check, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react"
import { Avatar } from "../ui/Avatar"
import { Tag } from "../ui/Tag"
import { cn, formatDistanceToNow } from "../../lib/utils"
import { renderEnhancedPreview } from "../../lib/latex"
import { useVotePoll, usePost, useCreateComment, useDeleteComment, useVoteSocial, useRepostPost, useQuotePost, useToggleBookmark, type PostEvent, type PostPoll } from "../../services/posts"
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
  votes?: { userId: string; value: number }[]
  bookmarks?: { userId: string }[]
  originalPostId?: string | null
  originalPost?: any | null
}

function getAvatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&bold=true&font-size=0.4&format=png`
}

export function FeedCard({
  id,
  author,
  departmentTag,
  departmentName,
  timestamp,
  content,
  stats: initialStats,
  variant = "default",
  event,
  poll,
  votes = [],
  bookmarks = [],
  originalPostId,
  originalPost,
}: FeedCardProps) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)

  const isSimpleRepost = !!originalPostId && !!originalPost && (!content || content.trim() === "")

  const displayAuthor = isSimpleRepost ? {
    id: originalPost.author.id,
    name: originalPost.author.name,
    handle: `@${originalPost.author.username}`,
    avatar: originalPost.author.avatar ?? undefined,
  } : author

  const displayTimestamp = isSimpleRepost ? formatDistanceToNow(new Date(originalPost.createdAt)) : timestamp
  const displayContent = isSimpleRepost ? originalPost.content : content
  const displayEvent = isSimpleRepost ? originalPost.event : event
  const displayPoll = isSimpleRepost ? originalPost.poll : poll
  const displayLikes = isSimpleRepost ? (originalPost.votes?.filter((v: any) => v.value === 1).length ?? 0) : initialStats.likes
  const displayComments = isSimpleRepost ? (originalPost._count?.comments ?? 0) : initialStats.comments
  const displayShares = isSimpleRepost ? (originalPost._count?.reposts ?? 0) : (initialStats.shares ?? 0)
  const displayId = isSimpleRepost ? originalPost.id : id
  const displayVotes = isSimpleRepost ? originalPost.votes : votes
  const displayBookmarks = isSimpleRepost ? (originalPost.bookmarks ?? []) : bookmarks

  const [likes, setLikes] = useState(displayLikes)
  const [shares, setShares] = useState(displayShares)

  const repostMutation = useRepostPost()
  const quoteMutation = useQuotePost()
  const toggleBookmark = useToggleBookmark()
  
  const [isRepostMenuOpen, setIsRepostMenuOpen] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [quoteCommentary, setQuoteCommentary] = useState("")

  // Sync likes and liked status reactively when user or votes list loads
  useEffect(() => {
    if (currentUser?.id && displayVotes) {
      const isLiked = displayVotes.some((v: any) => v.userId === currentUser.id && v.value === 1)
      setLiked(isLiked)
    }
  }, [currentUser?.id, displayVotes])

  // Sync likes count when displayLikes change
  useEffect(() => {
    setLikes(displayLikes)
  }, [displayLikes])

  // Sync shares count when displayShares change
  useEffect(() => {
    setShares(displayShares)
  }, [displayShares])

  // Sync reposted state when user loaded
  useEffect(() => {
    if (isSimpleRepost && currentUser?.id && author.id === currentUser.id) {
      setReposted(true)
    }
  }, [isSimpleRepost, currentUser?.id, author.id])

  // Sync bookmarked status reactively when user or bookmarks list loads
  useEffect(() => {
    if (currentUser?.id && displayBookmarks) {
      const isBookmarked = displayBookmarks.some((b: any) => b.userId === currentUser.id)
      setBookmarked(isBookmarked)
    }
  }, [currentUser?.id, displayBookmarks])

  // Interactive Comments State & Logic
  const [showComments, setShowComments] = useState(false)
  const [newCommentText, setNewCommentText] = useState("")
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [newReplyText, setNewReplyText] = useState("")

  const { data: postDetails, isLoading: commentsLoading } = usePost(id || "", showComments)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  const voteSocial = useVoteSocial()

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newCommentText.trim() || createComment.isPending) return
    createComment.mutate(
      { postId: id, content: newCommentText.trim() },
      {
        onSuccess: () => {
          setNewCommentText("")
        },
      }
    )
  }

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!id || !newReplyText.trim() || createComment.isPending) return
    createComment.mutate(
      { postId: id, content: newReplyText.trim(), parentId },
      {
        onSuccess: () => {
          setNewReplyText("")
          setReplyToCommentId(null)
        },
      }
    )
  }

  const handleCommentDelete = (commentId: string) => {
    if (!id || deleteComment.isPending) return
    deleteComment.mutate({ postId: id, commentId })
  }

  const handleCommentVote = (commentId: string, value: 1 | -1) => {
    if (!id || voteSocial.isPending) return
    voteSocial.mutate({ postId: id, commentId, value })
  }

  // Followers & Following state
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
    const targetPostId = displayId || id
    if (!targetPostId || voteSocial.isPending) return
    const nextLiked = !liked
    // Optimistic UI updates
    setLiked(nextLiked)
    setLikes((c: number) => c + (nextLiked ? 1 : -1))

    voteSocial.mutate(
      { postId: targetPostId, value: nextLiked ? 1 : 0 },
      {
        onError: () => {
          // Revert on error
          setLiked(!nextLiked)
          setLikes((c: number) => c + (nextLiked ? -1 : 1))
        },
      }
    )
  }

  const handleSimpleRepost = () => {
    const targetPostId = displayId || id
    if (!targetPostId || repostMutation.isPending) return
    setIsRepostMenuOpen(false)

    const nextReposted = !reposted
    setReposted(nextReposted)
    setShares((c: number) => c + (nextReposted ? 1 : -1))

    repostMutation.mutate(targetPostId, {
      onError: () => {
        setReposted(!nextReposted)
        setShares((c: number) => c + (nextReposted ? -1 : 1))
      },
    })
  }

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetPostId = displayId || id
    if (!targetPostId || !quoteCommentary.trim() || quoteMutation.isPending) return

    quoteMutation.mutate(
      { postId: targetPostId, content: quoteCommentary.trim() },
      {
        onSuccess: () => {
          setIsQuoteDialogOpen(false)
          setQuoteCommentary("")
        },
      }
    )
  }

  function handleBookmark() {
    const targetPostId = displayId || id
    if (!targetPostId || toggleBookmark.isPending) return
    const nextBookmarked = !bookmarked
    
    // Optimistic UI updates
    setBookmarked(nextBookmarked)
    
    toggleBookmark.mutate(targetPostId, {
      onError: () => {
        // Revert on error
        setBookmarked(!nextBookmarked)
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-gray-300/80 hover:shadow-sm">
      {isSimpleRepost && (
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-geist pb-1.5 border-b border-gray-100">
          <Repeat2 size={14} className="text-green-600 stroke-[2.5]" />
          <span className="font-semibold text-gray-700">{author.name}</span> reposted
        </div>
      )}

      <div className="flex items-start justify-between">
        <div 
          onClick={() => displayAuthor.id && navigate(`/profile?userId=${displayAuthor.id}`)}
          className="flex items-center gap-3 cursor-pointer group/author"
        >
          <Avatar 
            name={displayAuthor.name} 
            src={displayAuthor.avatar || getAvatarUrl(displayAuthor.name)} 
            size="md" 
            className="group-hover/author:opacity-90 transition-opacity" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-geist font-semibold text-[15px] text-gray-900 group-hover/author:underline group-hover/author:text-primary">
                {displayAuthor.name}
              </span>
              {departmentTag && !isSimpleRepost && (
                <Tag variant="department">{departmentTag}</Tag>
              )}
            </div>
            <span className="text-[13px] text-gray-500 font-inter group-hover/author:text-gray-600">
              {displayAuthor.handle} · {displayTimestamp}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSelf && displayAuthor.id && !isSimpleRepost && (
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

      {departmentName && !isSimpleRepost && (
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

      {displayContent && (
        <div className="text-[14px] text-gray-800 font-inter leading-relaxed whitespace-pre-wrap break-words">
          {renderEnhancedPreview(displayContent)}
        </div>
      )}

      {/* Render Nested Original Post Preview (For Quote Posts) */}
      {originalPost && !isSimpleRepost && (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/profile?userId=${originalPost.author.id}`)
          }}
          className="mt-2 p-3.5 bg-gray-50 border border-gray-200/70 rounded-xl hover:bg-gray-100/50 transition-colors duration-150 cursor-pointer space-y-2 select-none"
        >
          <div className="flex items-center gap-2">
            <Avatar 
              name={originalPost.author.name} 
              src={originalPost.author.avatar || getAvatarUrl(originalPost.author.name)} 
              size="sm" 
            />
            <span className="font-geist font-semibold text-[13px] text-gray-900 leading-none">
              {originalPost.author.name}
            </span>
            <span className="text-[11px] text-gray-500 font-inter">
              @{originalPost.author.username} · {formatDistanceToNow(new Date(originalPost.createdAt))}
            </span>
          </div>
          {originalPost.content && (
            <div className="text-[13px] text-gray-700 font-inter leading-relaxed line-clamp-3">
              {renderEnhancedPreview(originalPost.content)}
            </div>
          )}
        </div>
      )}

      {/* Render Associated Event */}
      {displayEvent && (
        <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <div className="flex items-center gap-1.5 text-[11px] font-geist font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
            <Calendar size={13} />
            Event Details
          </div>
          <p className="text-[14px] font-geist font-semibold text-gray-900">{displayEvent.title}</p>
          <div className="mt-1 space-y-0.5 text-[12px] text-gray-600 font-inter">
            <p>
              📅 {new Date(displayEvent.date).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                hour: "numeric", minute: "2-digit"
              })}
            </p>
            {displayEvent.location && <p>📍 {displayEvent.location}</p>}
          </div>
          {displayEvent.description && (
            <p className="mt-1 text-[12px] text-gray-500 font-inter leading-relaxed">{displayEvent.description}</p>
          )}
        </div>
      )}

      {displayPoll && (() => {
        const totalVotes = displayPoll.options.reduce((sum: number, opt: any) => sum + opt._count.votes, 0)
        return (
          <div className="mt-3 p-3.5 bg-amber-50/55 rounded-lg border border-amber-200/50 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-geist font-semibold text-amber-700 uppercase tracking-wide">
              <VoteIcon size={13} />
              Interactive Poll
            </div>
            <p className="text-[14px] font-geist font-medium text-gray-900 leading-snug">{displayPoll.question}</p>
            <div className="space-y-2">
              {displayPoll.options.map((option: any) => {
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
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5 cursor-pointer select-none",
            liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
          )}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          {likes}
        </button>
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5 cursor-pointer select-none",
            showComments ? "text-blue-600 font-semibold" : "text-gray-400 hover:text-blue-600"
          )}
        >
          <MessageCircle size={16} fill={showComments ? "currentColor" : "none"} />
          {displayComments}
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsRepostMenuOpen(!isRepostMenuOpen)
            }}
            className={cn(
              "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5 cursor-pointer select-none",
              reposted ? "text-green-600 font-semibold" : "text-gray-400 hover:text-green-600"
            )}
          >
            <Repeat2 size={16} className={cn(reposted && "stroke-[2.5] scale-110")} />
            {shares}
          </button>

          {isRepostMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsRepostMenuOpen(false)} />
              <div className="absolute left-0 mt-2 w-72 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/60 rounded-xl shadow-xl z-30 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Repost Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSimpleRepost()
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-surface-container-high/80 flex items-start gap-3 cursor-pointer transition-all duration-150 group/repost"
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    reposted 
                      ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" 
                      : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                  )}>
                    <Repeat2 size={16} className="group-hover/repost:rotate-180 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-geist font-semibold text-on-surface leading-snug">
                      {reposted ? "Undo Repost" : "Repost"}
                    </p>
                    <p className="text-[11px] font-inter text-on-surface-variant/80 mt-0.5 leading-normal">
                      {reposted ? "Remove this post from your profile feed." : "Share this post instantly with your followers."}
                    </p>
                  </div>
                </button>

                {/* Subtle Divider */}
                <div className="h-px bg-outline-variant/30 my-1.5" />

                {/* Quote Post Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsRepostMenuOpen(false)
                    setIsQuoteDialogOpen(true)
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-surface-container-high/80 flex items-start gap-3 cursor-pointer transition-all duration-150 group/quote"
                >
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <Repeat2 size={16} className="rotate-90 group-hover/quote:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-geist font-semibold text-on-surface leading-snug">
                      Quote Post
                    </p>
                    <p className="text-[11px] font-inter text-on-surface-variant/80 mt-0.5 leading-normal">
                      Add your thoughts, latex, or code before sharing.
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-geist transition-colors py-1.5 ml-auto cursor-pointer select-none",
            bookmarked ? "text-blue-600" : "text-gray-400 hover:text-blue-600"
          )}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {showComments && (
        <div className="pt-4 border-t border-gray-100 space-y-4 transition-all duration-200">
          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start">
            <Avatar
              name={currentUser?.name || "User"}
              src={currentUser?.avatar || getAvatarUrl(currentUser?.name || "User")}
              size="sm"
            />
            <div className="flex-1 relative flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                disabled={createComment.isPending}
                className="w-full px-3.5 py-2 text-[13px] font-inter text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all duration-200 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || createComment.isPending}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[13px] font-geist font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 select-none",
                  newCommentText.trim() && !createComment.isPending
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {createComment.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : postDetails?.comments && postDetails.comments.length > 0 ? (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {postDetails.comments.map((comment) => {
                const score = comment.votes?.reduce((sum, v) => sum + v.value, 0) || 0
                const userVote = comment.votes?.find((v) => v.userId === currentUser?.id)?.value || 0
                const isCommentAuthor = currentUser?.id === comment.authorId

                return (
                  <div key={comment.id} className="space-y-2">
                    <div className="group flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50/50 transition-colors duration-150 relative">
                      {/* Voting Controls */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5 bg-gray-50/80 rounded-md py-0.5 px-1 border border-gray-100">
                        <button
                          onClick={() => handleCommentVote(comment.id, 1)}
                          className={cn(
                            "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                            userVote === 1 ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <ChevronUp size={15} className="stroke-[2.5]" />
                        </button>
                        <span className={cn(
                          "text-[10px] font-mono font-bold leading-none select-none my-0.5",
                          score > 0 ? "text-green-600" : score < 0 ? "text-red-500" : "text-gray-400"
                        )}>
                          {score}
                        </span>
                        <button
                          onClick={() => handleCommentVote(comment.id, -1)}
                          className={cn(
                            "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                            userVote === -1 ? "text-red-500" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <ChevronDown size={15} className="stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Comment Body */}
                      <span 
                        className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                        onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
                      >
                        <Avatar
                          name={comment.author.name}
                          src={comment.author.avatar || getAvatarUrl(comment.author.name)}
                          size="sm"
                        />
                      </span>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="text-[13px] font-geist font-semibold text-gray-900 leading-none cursor-pointer hover:underline hover:text-primary"
                              onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
                            >
                              {comment.author.name}
                            </span>
                            <span 
                              className="text-[11px] text-gray-400 font-inter cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
                            >
                              @{comment.author.username}
                            </span>
                            <span className="text-[11px] text-gray-400 font-inter select-none">
                              · {formatDistanceToNow(comment.createdAt)}
                            </span>
                          </div>
                          {isCommentAuthor && (
                            <button
                              onClick={() => handleCommentDelete(comment.id)}
                              disabled={deleteComment.isPending}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-all duration-150 cursor-pointer disabled:opacity-50"
                              title="Delete comment"
                            >
                              {deleteComment.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[13px] text-gray-700 font-inter leading-relaxed whitespace-pre-wrap break-words">
                          {renderEnhancedPreview(comment.content)}
                        </div>

                        {/* Action Bar (Reply) */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <button
                            onClick={() => {
                              setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)
                              setNewReplyText("")
                            }}
                            className={cn(
                              "text-[11px] font-geist font-medium transition-colors cursor-pointer select-none py-0.5",
                              replyToCommentId === comment.id ? "text-blue-600 font-semibold" : "text-gray-400 hover:text-blue-600"
                            )}
                          >
                            Reply
                          </button>
                        </div>

                        {/* Reply Form */}
                        {replyToCommentId === comment.id && (
                          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 items-center mt-2 pl-2 border-l-2 border-blue-500/50">
                            <input
                              type="text"
                              value={newReplyText}
                              onChange={(e) => setNewReplyText(e.target.value)}
                              placeholder={`Reply to @${comment.author.username}...`}
                              disabled={createComment.isPending}
                              className="flex-1 px-3 py-1.5 text-[12px] font-inter text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all placeholder-gray-400"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={!newReplyText.trim() || createComment.isPending}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[12px] font-geist font-semibold cursor-pointer shrink-0 transition-all select-none",
                                newReplyText.trim() && !createComment.isPending
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              )}
                            >
                              Post
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Replies Thread */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 pl-4 border-l-2 border-gray-100/80 space-y-3.5">
                        {comment.replies.map((reply) => {
                          const replyScore = reply.votes?.reduce((sum, v) => sum + v.value, 0) || 0
                          const replyUserVote = reply.votes?.find((v) => v.userId === currentUser?.id)?.value || 0
                          const isReplyAuthor = currentUser?.id === reply.authorId

                          return (
                            <div key={reply.id} className="group flex gap-2 items-start relative p-1.5 rounded-lg hover:bg-gray-50/30 transition-colors">
                              {/* Voting Controls for Reply */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5 bg-gray-50/40 rounded py-0.5 px-0.5 border border-gray-100/50">
                                <button
                                  onClick={() => handleCommentVote(reply.id, 1)}
                                  className={cn(
                                    "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                                    replyUserVote === 1 ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                                  )}
                                >
                                  <ChevronUp size={13} className="stroke-[2.5]" />
                                </button>
                                <span className={cn(
                                  "text-[9px] font-mono font-bold leading-none select-none my-0.5",
                                  replyScore > 0 ? "text-green-600" : replyScore < 0 ? "text-red-500" : "text-gray-400"
                                )}>
                                  {replyScore}
                                </span>
                                <button
                                  onClick={() => handleCommentVote(reply.id, -1)}
                                  className={cn(
                                    "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                                    replyUserVote === -1 ? "text-red-500" : "text-gray-400 hover:text-gray-600"
                                  )}
                                >
                                  <ChevronDown size={13} className="stroke-[2.5]" />
                                </button>
                              </div>

                              {/* Reply Body */}
                              <span 
                                className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                                onClick={() => navigate(`/profile?userId=${reply.authorId}`)}
                              >
                                <Avatar
                                  name={reply.author.name}
                                  src={reply.author.avatar || getAvatarUrl(reply.author.name)}
                                  size="sm"
                                />
                              </span>
                              <div className="flex-1 space-y-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span 
                                      className="text-[12px] font-geist font-semibold text-gray-900 leading-none cursor-pointer hover:underline hover:text-primary"
                                      onClick={() => navigate(`/profile?userId=${reply.authorId}`)}
                                    >
                                      {reply.author.name}
                                    </span>
                                    <span 
                                      className="text-[10px] text-gray-400 font-inter cursor-pointer hover:underline"
                                      onClick={() => navigate(`/profile?userId=${reply.authorId}`)}
                                    >
                                      @{reply.author.username}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-inter select-none">
                                      · {formatDistanceToNow(reply.createdAt)}
                                    </span>
                                  </div>
                                  {isReplyAuthor && (
                                    <button
                                      onClick={() => handleCommentDelete(reply.id)}
                                      disabled={deleteComment.isPending}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-all duration-150 cursor-pointer disabled:opacity-50"
                                      title="Delete reply"
                                    >
                                      {deleteComment.isPending ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={12} />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="text-[12px] text-gray-700 font-inter leading-relaxed whitespace-pre-wrap break-words">
                                  {renderEnhancedPreview(reply.content)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-50/40 rounded-lg border border-dashed border-gray-200">
              <p className="text-[12px] font-geist font-medium text-gray-400">
                No comments yet. Start the conversation!
              </p>
            </div>
          )}

        </div>
      )}

      {isQuoteDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsQuoteDialogOpen(false);
          }}
        >
          <div 
            className="bg-surface-container-lowest border border-outline-variant/60 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-on-surface font-geist">Quote Post</h3>
              <button 
                type="button"
                onClick={() => setIsQuoteDialogOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleQuoteSubmit} className="p-5 space-y-4 flex flex-col overflow-y-auto">
              <textarea
                rows={4}
                value={quoteCommentary}
                onChange={(e) => setQuoteCommentary(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-surface-container-low/50 border border-outline-variant/40 rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary/80 transition-all duration-200 placeholder:text-on-surface-variant/50 font-inter resize-none"
                autoFocus
              />

              {/* Nested Post Preview */}
              <div className="p-3.5 bg-surface-container border border-outline-variant/40 rounded-xl select-none space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar name={displayAuthor.name} src={displayAuthor.avatar} size="sm" />
                  <span className="font-geist font-semibold text-[13px] text-on-surface leading-none">{displayAuthor.name}</span>
                  <span className="text-[11px] text-on-surface-variant/80 font-inter">{displayAuthor.handle} · {displayTimestamp}</span>
                </div>
                {displayContent && (
                  <p className="text-[13px] text-on-surface-variant font-inter leading-relaxed line-clamp-3">
                    {displayContent}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3.5 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuoteDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-geist font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quoteCommentary.trim() || quoteMutation.isPending}
                  className={cn(
                    "px-5 py-2 rounded-lg text-[13px] font-geist font-semibold transition-all duration-150 cursor-pointer select-none",
                    quoteCommentary.trim() && !quoteMutation.isPending
                      ? "bg-primary text-on-primary hover:bg-primary/95 shadow-sm active:scale-[0.98]"
                      : "bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/20"
                  )}
                >
                  Post Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
