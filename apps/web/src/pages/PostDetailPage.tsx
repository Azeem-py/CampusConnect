import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  MessageSquare, 
  Share2, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Check
} from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { FeedCard } from "../components/feed/FeedCard"
import { TrendingWidget } from "../components/widgets/TrendingWidget"
import { ScholarsWidget } from "../components/widgets/ScholarsWidget"
import { usePost, useCreateComment, useDeleteComment, useVoteSocial } from "../services/posts"
import { useAuth } from "../contexts/AuthContext"
import { useSearchScholars } from "../services/auth"
import { Avatar } from "../components/ui/Avatar"
import { cn, formatDistanceToNow } from "../lib/utils"
import { renderEnhancedPreview } from "../lib/latex"

function PostDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3">
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
      <div className="space-y-3 pt-6">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        {[1, 2].map((n) => (
          <div key={n} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getAvatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&bold=true&font-size=0.4&format=png`
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const { data: post, isLoading, error } = usePost(id || "")
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  const voteSocial = useVoteSocial()

  const [newCommentText, setNewCommentText] = useState("")
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [newReplyText, setNewReplyText] = useState("")
  const [copied, setCopied] = useState(false)

  // --- @Mention Autocomplete State & Hooks ---
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [activeInputType, setActiveInputType] = useState<'comment' | 'reply' | null>(null)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)

  const { data: searchedScholars } = useSearchScholars(mentionSearch || "", mentionSearch !== null)

  const checkMentionTrigger = (value: string, selectionStart: number | null) => {
    const textBeforeCursor = value.slice(0, selectionStart ?? 0)
    const lastAt = textBeforeCursor.lastIndexOf("@")
    
    if (lastAt !== -1) {
      const charBeforeAt = lastAt > 0 ? textBeforeCursor[lastAt - 1] : " "
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.slice(lastAt + 1)
        if (/^[a-zA-Z0-9_-]*$/.test(query)) {
          setMentionSearch(query)
          setActiveMentionIndex(0)
          return
        }
      }
    }
    setMentionSearch(null)
  }

  const insertMention = (username: string) => {
    if (activeInputType === 'comment') {
      const textarea = document.getElementById("post-detail-comment-input") as HTMLTextAreaElement
      if (!textarea) return
      
      const val = newCommentText
      const selStart = textarea.selectionStart
      const textBeforeCursor = val.slice(0, selStart)
      const lastAt = textBeforeCursor.lastIndexOf("@")
      
      if (lastAt !== -1) {
        const startText = val.slice(0, lastAt)
        const endText = val.slice(selStart)
        const updatedVal = `${startText}@${username} ${endText}`
        setNewCommentText(updatedVal)
        
        const newOffset = lastAt + username.length + 2
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(newOffset, newOffset)
        }, 10)
      }
    } else if (activeInputType === 'reply') {
      if (!replyToCommentId) return
      const input = document.getElementById(`reply-input-${replyToCommentId}`) as HTMLInputElement
      if (!input) return
      
      const val = newReplyText
      const selStart = input.selectionStart ?? 0
      const textBeforeCursor = val.slice(0, selStart)
      const lastAt = textBeforeCursor.lastIndexOf("@")
      
      if (lastAt !== -1) {
        const startText = val.slice(0, lastAt)
        const endText = val.slice(selStart)
        const updatedVal = `${startText}@${username} ${endText}`
        setNewReplyText(updatedVal)
        
        const newOffset = lastAt + username.length + 2
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(newOffset, newOffset)
        }, 10)
      }
    }
    setMentionSearch(null)
    setActiveInputType(null)
  }

  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNewCommentText(val)
    setActiveInputType('comment')
    checkMentionTrigger(val, e.target.selectionStart)
  }

  const handleCommentSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    setActiveInputType('comment')
    checkMentionTrigger(target.value, target.selectionStart)
  }

  const handleReplyTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewReplyText(val)
    setActiveInputType('reply')
    checkMentionTrigger(val, e.target.selectionStart)
  }

  const handleReplySelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    setActiveInputType('reply')
    checkMentionTrigger(target.value, target.selectionStart)
  }

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && searchedScholars && searchedScholars.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveMentionIndex((prev) => (prev + 1) % searchedScholars.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveMentionIndex((prev) => (prev - 1 + searchedScholars.length) % searchedScholars.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (searchedScholars[activeMentionIndex]) {
          insertMention(searchedScholars[activeMentionIndex].username)
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setMentionSearch(null)
        setActiveInputType(null)
        return
      }
    }
  }

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionSearch !== null && searchedScholars && searchedScholars.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveMentionIndex((prev) => (prev + 1) % searchedScholars.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveMentionIndex((prev) => (prev - 1 + searchedScholars.length) % searchedScholars.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (searchedScholars[activeMentionIndex]) {
          insertMention(searchedScholars[activeMentionIndex].username)
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setMentionSearch(null)
        setActiveInputType(null)
        return
      }
    }
  }

  // Update Page Document Title
  useEffect(() => {
    if (post?.author?.name) {
      document.title = `Scholarsphere - Discussion by ${post.author.name}`
    } else {
      document.title = "Scholarsphere - Post Detail"
    }
  }, [post])

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-16 lg:pb-0">
        <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
          <Sidebar />
          <main className="flex-1 max-w-[600px] min-w-0">
            <PostDetailSkeleton />
          </main>
          <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
            <TrendingWidget />
            <ScholarsWidget />
          </aside>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white pb-16 lg:pb-0">
        <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
          <Sidebar />
          <main className="flex-1 max-w-[600px] min-w-0 py-12 text-center space-y-4">
            <p className="text-red-500 font-geist font-medium text-lg">Post not found or failed to load.</p>
            <button 
              onClick={() => navigate("/feed")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <ArrowLeft size={16} />
              Back to Feed
            </button>
          </main>
          <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
            <TrendingWidget />
            <ScholarsWidget />
          </aside>
        </div>
      </div>
    )
  }

  const variant = post.event ? "announcement" : post.poll ? "discussion" : "default"

  return (
    <div className="min-h-screen bg-white pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors py-1 cursor-pointer font-geist font-semibold text-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareClick}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-geist cursor-pointer transition-all duration-200 select-none shadow-sm",
                  copied 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {copied ? <Check size={13} className="stroke-[2.5]" /> : <Share2 size={13} />}
                {copied ? "Link Copied" : "Share"}
              </button>
            </div>
          </div>

          {/* Main Card */}
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
            isDetailPage={true}
          />

          {/* Dedicated Full-Page Comment Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <MessageSquare size={18} className="text-gray-500" />
              <h2 className="font-geist font-bold text-headline-sm text-gray-900">
                Discussion ({post.comments?.length || 0} top-level { (post.comments?.length || 0) === 1 ? "comment" : "comments" })
              </h2>
            </div>

            {/* Add Top-Level Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <Avatar
                name={currentUser?.name || "User"}
                src={currentUser?.avatar || getAvatarUrl(currentUser?.name || "User")}
                size="sm"
                className="ring-1 ring-black/5"
              />
              <div className="flex-1 space-y-3 relative">
                <textarea
                  id="post-detail-comment-input"
                  value={newCommentText}
                  onChange={handleCommentTextChange}
                  onSelect={handleCommentSelect}
                  onKeyUp={handleCommentSelect}
                  onMouseUp={handleCommentSelect}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Join the discussion... Type here (LaTeX $$formula$$ and code blocks supported)"
                  disabled={createComment.isPending}
                  rows={2}
                  className="w-full px-3.5 py-2 text-[13px] font-inter text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all duration-200 placeholder-gray-400 font-inter resize-none"
                />

                {mentionSearch !== null && activeInputType === 'comment' && searchedScholars && searchedScholars.length > 0 && (
                  <div className="absolute left-0 bottom-full mb-2 z-50 w-full max-w-xs bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto font-geist">
                    {searchedScholars.map((scholar, idx) => (
                      <button
                        key={scholar.id}
                        type="button"
                        onClick={() => insertMention(scholar.username)}
                        onMouseEnter={() => setActiveMentionIndex(idx)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150",
                          idx === activeMentionIndex
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <Avatar
                          name={scholar.name ?? scholar.username}
                          src={scholar.avatar ?? undefined}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate leading-none">
                            {scholar.name || scholar.username}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate mt-0.5 leading-none">
                            @{scholar.username}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim() || createComment.isPending}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[13px] font-geist font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none",
                      newCommentText.trim() && !createComment.isPending
                        ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {createComment.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Post Comment"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Comment Thread List */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-6 pt-2">
                {post.comments.map((comment) => {
                  const score = comment.votes?.reduce((sum, v) => sum + v.value, 0) || 0
                  const userVote = comment.votes?.find((v) => v.userId === currentUser?.id)?.value || 0
                  const isCommentAuthor = currentUser?.id === comment.authorId

                  return (
                    <div key={comment.id} className="space-y-3">
                      {/* Top-Level Comment Card */}
                      <div className="group flex gap-3 items-start relative p-3 rounded-xl border border-gray-100 bg-white hover:shadow-sm hover:border-gray-200 transition-all duration-200">
                        {/* Vote Controls on Left */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5 bg-gray-50/80 rounded-md py-1 px-1.5 border border-gray-100">
                          <button
                            onClick={() => handleCommentVote(comment.id, 1)}
                            className={cn(
                              "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                              userVote === 1 ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            <ChevronUp size={16} className="stroke-[2.5]" />
                          </button>
                          <span className={cn(
                            "text-[11px] font-mono font-bold leading-none select-none my-0.5 min-w-[12px] text-center",
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
                            <ChevronDown size={16} className="stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Comment Body */}
                        <div 
                          className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                          onClick={() => navigate(`/profile?userId=${comment.authorId}`)}
                        >
                          <Avatar
                            name={comment.author.name}
                            src={comment.author.avatar || getAvatarUrl(comment.author.name)}
                            size="md"
                            className="ring-1 ring-black/5"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
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
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded transition-all duration-150 cursor-pointer disabled:opacity-50"
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
                          <div className="text-[13px] text-gray-800 font-inter leading-relaxed whitespace-pre-wrap break-words">
                            {renderEnhancedPreview(comment.content)}
                          </div>

                          {/* Comment Actions (Reply toggle) */}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => {
                                setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)
                                setNewReplyText("")
                              }}
                              className={cn(
                                "text-[11px] font-geist font-medium transition-colors cursor-pointer select-none py-0.5 px-2 rounded-full border bg-gray-50 border-gray-100",
                                replyToCommentId === comment.id 
                                  ? "text-blue-600 border-blue-100 bg-blue-50 font-semibold" 
                                  : "text-gray-500 hover:text-blue-600 hover:border-gray-200"
                              )}
                            >
                              Reply
                            </button>
                          </div>

                          {/* Reply Form */}
                          {replyToCommentId === comment.id && (
                             <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 items-center mt-3 pl-3 border-l-2 border-blue-500/50 bg-blue-50/10 p-2 rounded-r-lg relative">
                               <input
                                 id={`reply-input-${comment.id}`}
                                 type="text"
                                 value={newReplyText}
                                 onChange={handleReplyTextChange}
                                 onSelect={handleReplySelect}
                                 onKeyUp={handleReplySelect}
                                 onMouseUp={handleReplySelect}
                                 onKeyDown={handleReplyKeyDown}
                                 placeholder={`Reply to @${comment.author.username}...`}
                                 disabled={createComment.isPending}
                                 className="flex-1 px-3 py-1.5 text-[12px] font-inter text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all placeholder-gray-400"
                                 autoFocus
                               />

                               {mentionSearch !== null && activeInputType === 'reply' && searchedScholars && searchedScholars.length > 0 && (
                                 <div className="absolute left-3 bottom-full mb-2 z-50 w-full max-w-xs bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto font-geist">
                                   {searchedScholars.map((scholar, idx) => (
                                     <button
                                       key={scholar.id}
                                       type="button"
                                       onClick={() => insertMention(scholar.username)}
                                       onMouseEnter={() => setActiveMentionIndex(idx)}
                                       className={cn(
                                         "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150",
                                         idx === activeMentionIndex
                                           ? "bg-blue-50 text-blue-700 font-medium"
                                           : "text-gray-700 hover:bg-gray-50"
                                       )}
                                     >
                                       <Avatar
                                         name={scholar.name ?? scholar.username}
                                         src={scholar.avatar ?? undefined}
                                         size="sm"
                                       />
                                       <div className="flex-1 min-w-0">
                                         <div className="text-[12px] font-semibold truncate leading-none">
                                           {scholar.name || scholar.username}
                                         </div>
                                         <div className="text-[10px] text-gray-500 truncate mt-0.5 leading-none">
                                           @{scholar.username}
                                         </div>
                                       </div>
                                     </button>
                                   ))}
                                 </div>
                               )}

                               <button
                                 type="submit"
                                 disabled={!newReplyText.trim() || createComment.isPending}
                                 className={cn(
                                   "px-3 py-1.5 rounded-lg text-[12px] font-geist font-semibold cursor-pointer shrink-0 transition-all select-none",
                                   newReplyText.trim() && !createComment.isPending
                                     ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                     : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                 )}
                               >
                                 Post
                               </button>
                             </form>
                          )}
                        </div>
                      </div>

                      {/* Replies List (Indented & Connected) */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 pl-5 border-l border-gray-200/80 space-y-3">
                          {comment.replies.map((reply) => {
                            const replyScore = reply.votes?.reduce((sum, v) => sum + v.value, 0) || 0
                            const replyUserVote = reply.votes?.find((v) => v.userId === currentUser?.id)?.value || 0
                            const isReplyAuthor = currentUser?.id === reply.authorId

                            return (
                              <div key={reply.id} className="group flex gap-2.5 items-start relative p-2.5 rounded-xl border border-gray-50 bg-gray-50/20 hover:bg-gray-50/50 hover:border-gray-200/50 transition-all duration-150">
                                {/* Reply Vote Controls */}
                                <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5 bg-gray-50/40 rounded py-0.5 px-1 border border-gray-100/50">
                                  <button
                                    onClick={() => handleCommentVote(reply.id, 1)}
                                    className={cn(
                                      "p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer select-none",
                                      replyUserVote === 1 ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                                    )}
                                  >
                                    <ChevronUp size={14} className="stroke-[2.5]" />
                                  </button>
                                  <span className={cn(
                                    "text-[10px] font-mono font-bold leading-none select-none my-0.5 min-w-[10px] text-center",
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
                                    <ChevronDown size={14} className="stroke-[2.5]" />
                                  </button>
                                </div>

                                {/* Reply Body */}
                                <div 
                                  className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                                  onClick={() => navigate(`/profile?userId=${reply.authorId}`)}
                                >
                                  <Avatar
                                    name={reply.author.name}
                                    src={reply.author.avatar || getAvatarUrl(reply.author.name)}
                                    size="sm"
                                    className="ring-1 ring-black/5"
                                  />
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
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
              <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm font-geist font-medium text-gray-400">
                  No comments yet. Start the academic dialogue!
                </p>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TrendingWidget />
          <ScholarsWidget />
        </aside>
      </div>
    </div>
  )
}
