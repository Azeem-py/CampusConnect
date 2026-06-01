import { useState, useCallback } from "react"
import {
  ArrowLeft, Hash, Calendar, Vote, Bold, Italic, Underline, Strikethrough,
  Link as LinkIcon, List, ListOrdered, Sigma, Image, Paperclip, Eye,
  XCircle, Send,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { Sidebar } from "../components/layout/Sidebar"
import { renderEnhancedPreview } from "../lib/latex"
import { MathKeyboard } from "../components/create/MathKeyboard"
import { EventDialog, type EventData } from "../components/create/EventDialog"
import { PollDialog, type PollData } from "../components/create/PollDialog"
import { useContentEditable } from "../hooks/useContentEditable"
import { useCreatePost } from "../services/posts"
import { useAuth } from "../contexts/AuthContext"

export function CreatePostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createPost = useCreatePost()
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showPollDialog, setShowPollDialog] = useState(false)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const {
    editorRef, plainContent, insertAtCursor,
    handleInput, handleKeyDown, handleMouseDown, isEmpty,
  } = useContentEditable()

  const handlePost = useCallback(() => {
    createPost.mutate(
      {
        content: plainContent,
        status: 'PUBLISHED',
        courseCode: 'CS-412',
        event: eventData,
        poll: pollData,
      },
      {
        onSuccess: () => navigate('/feed'),
      },
    )
  }, [plainContent, eventData, pollData, createPost, navigate])

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }))
  }, [editorRef])

  const handleBold = useCallback(() => exec("bold"), [exec])
  const handleItalic = useCallback(() => exec("italic"), [exec])
  const handleUnderline = useCallback(() => exec("underline"), [exec])
  const handleStrikethrough = useCallback(() => exec("strikeThrough"), [exec])

  const handleLink = useCallback(() => {
    const url = prompt("Enter URL:", "https://")
    if (url) exec("createLink", url)
  }, [exec])

  const handleBulletList = useCallback(() => exec("insertUnorderedList"), [exec])
  const handleNumberedList = useCallback(() => exec("insertOrderedList"), [exec])

  const charCount = plainContent.length

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        {/* ─── Sidebar ─── */}
        <Sidebar />

        {/* ─── Page Content ─── */}
        <div className="flex-1 min-w-0">
          {/* ─── Contextual Action Bar ─── */}
          <div className="sticky top-14 z-40 glass-toolbar border border-outline-variant/15 rounded-xl mb-5">
            <div className="flex items-center justify-between h-14 px-4 lg:px-5">
              <Link
                to="/feed"
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors no-underline group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-label-md font-geist font-medium hidden sm:inline">
                  Back to Feed
                </span>
              </Link>

              <h1 className="text-title-md font-geist font-semibold text-on-surface">
                Create Post
              </h1>

              <div className="flex items-center gap-3">
                {createPost.isError && (
                  <span className="text-label-sm text-error font-geist max-w-[180px] text-right leading-tight hidden sm:inline">
                    {createPost.error?.message || 'Failed to post'}
                  </span>
                )}
                <Button
                  variant="primary"
                  size="md"
                  className="font-semibold px-5 gap-2"
                  disabled={isEmpty || createPost.isPending}
                  loading={createPost.isPending}
                  onClick={handlePost}
                  icon={<Send size={15} />}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Mobile Error Banner ─── */}
          {createPost.isError && (
            <div className="sm:hidden mb-4 px-3 py-2 rounded-lg bg-error-container text-on-error-container text-label-sm font-geist">
              {createPost.error?.message || 'Failed to post'}
            </div>
          )}

          {/* ─── Main Content ─── */}
          <div className="flex flex-col lg:flex-row gap-6 animate-slide-up">
        {/* ─── Editor Column ─── */}
        <section className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Meta Chips Row */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <Avatar
              name={user?.name ?? "You"}
              src={user?.avatar ?? undefined}
              size="md"
              className="ring-2 ring-primary/10"
            />

            <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/8 rounded-full border border-primary/15 hover:border-primary/30 hover:bg-primary/12 transition-all text-label-md font-geist font-medium text-primary">
              <Hash size={14} />
              CS-412
            </button>

            {eventData ? (
              <button
                onClick={() => setEventData(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-tint/10 rounded-full border border-surface-tint/25 text-label-md font-geist font-medium text-surface-tint hover:bg-surface-tint/15 transition-all group"
                title="Remove event"
              >
                <Calendar size={14} />
                Event Added
                <XCircle size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <button
                onClick={() => setShowEventDialog(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container rounded-full border border-outline-variant/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-label-md font-geist font-medium text-on-surface-variant hover:text-primary"
              >
                <Calendar size={14} />
                Add Event
              </button>
            )}

            {pollData ? (
              <button
                onClick={() => setPollData(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-tertiary/10 rounded-full border border-tertiary/25 text-label-md font-geist font-medium text-tertiary hover:bg-tertiary/15 transition-all group"
                title="Remove poll"
              >
                <Vote size={14} />
                Poll Added
                <XCircle size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <button
                onClick={() => setShowPollDialog(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container rounded-full border border-outline-variant/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-label-md font-geist font-medium text-on-surface-variant hover:text-primary"
              >
                <Vote size={14} />
                Add Poll
              </button>
            )}
          </div>

          {/* Editor Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 flex-grow overflow-hidden">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-outline-variant/12 glass-toolbar overflow-x-auto scrollbar-thin-styled">
              <ToolbarBtn onClick={handleBold} title="Bold (Ctrl+B)">
                <Bold size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={handleItalic} title="Italic (Ctrl+I)">
                <Italic size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={handleUnderline} title="Underline (Ctrl+U)">
                <Underline size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={handleStrikethrough} title="Strikethrough">
                <Strikethrough size={15} />
              </ToolbarBtn>

              <div className="w-px h-5 bg-outline-variant/20 mx-1.5 shrink-0" />

              <ToolbarBtn onClick={handleLink} title="Insert Link (Ctrl+K)">
                <LinkIcon size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={handleBulletList} title="Bullet List">
                <List size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={handleNumberedList} title="Numbered List">
                <ListOrdered size={15} />
              </ToolbarBtn>

              <div className="w-px h-5 bg-outline-variant/20 mx-1.5 shrink-0" />

              <button
                onClick={() => setShowKeyboard((prev) => !prev)}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-label-md font-geist font-medium ml-auto shrink-0",
                  showKeyboard
                    ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary",
                ].join(" ")}
                title="Math/LaTeX Keyboard"
              >
                <Sigma size={16} className={showKeyboard ? "rotate-0" : ""} />
                <span className="hidden sm:inline">Math</span>
              </button>
            </div>

            {/* Math Keyboard */}
            {showKeyboard && <MathKeyboard onInsert={insertAtCursor} />}

            {/* Content Editable Area */}
            <div className="p-5 flex-grow flex flex-col min-h-[350px] lg:min-h-[420px]">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                className="w-full flex-grow resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-body-lg text-on-surface font-jetbrains-mono leading-relaxed p-0 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-variant/40 empty:before:font-inter empty:before:text-body-lg"
                data-placeholder="What are your thoughts or findings? Start typing here... Use $$...$$ for LaTeX"
                role="textbox"
                aria-multiline="true"
              />
            </div>

            {/* Editor Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/12 glass-toolbar">
              <div className="flex gap-1">
                <ToolbarBtn title="Add Image">
                  <Image size={16} className="text-primary/70" />
                </ToolbarBtn>
                <ToolbarBtn title="Attach File">
                  <Paperclip size={16} className="text-primary/70" />
                </ToolbarBtn>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-label-sm font-mono text-on-surface-variant/50 select-none tabular-nums">
                  {charCount > 0 ? `${charCount.toLocaleString()} chars` : "Markdown & LaTeX supported"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Live Preview Column ─── */}
        <aside className="w-full lg:w-[380px] xl:w-[400px] flex flex-col gap-4 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-8.5rem)]">
          <h2 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface">
            <div className="p-1.5 rounded-lg bg-primary/8">
              <Eye size={16} className="text-primary" />
            </div>
            Live Preview
          </h2>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5 shadow-sm flex-1 overflow-y-auto scrollbar-thin-styled">
            {/* Author Header */}
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-outline-variant/10">
              <Avatar
                name={user?.name ?? "You"}
                src={user?.avatar ?? undefined}
                size="sm"
                className="ring-1 ring-outline-variant/10"
              />
              <div>
                <div className="text-title-sm font-geist font-semibold text-on-surface leading-none">
                  {user?.name ?? "You"}
                </div>
                <div className="text-label-sm font-inter text-on-surface-variant mt-0.5">
                  Just now
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="text-body-lg text-on-surface font-inter leading-relaxed space-y-3">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-3">
                    <Eye size={20} className="text-on-surface-variant/40" />
                  </div>
                  <p className="text-on-surface-variant/50 text-body-md font-inter">
                    Start typing to see your preview...
                  </p>
                </div>
              ) : (
                renderEnhancedPreview(plainContent)
              )}
            </div>

            {/* Event Preview */}
            {eventData && (
              <div className="mt-5 p-4 bg-surface-container-low rounded-xl border-l-3 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-1.5 text-label-sm font-geist font-semibold text-primary uppercase tracking-wider mb-2.5 relative">
                  <Calendar size={13} />
                  Event
                </div>
                <p className="text-title-sm font-geist font-semibold text-on-surface relative">{eventData.title}</p>
                <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant font-inter relative">
                  <p>
                    📅 {new Date(eventData.date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}{eventData.time ? ` · ${new Date(`2000-01-01T${eventData.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </p>
                  {eventData.location && <p>📍 {eventData.location}</p>}
                </div>
                {eventData.description && (
                  <p className="mt-2 text-body-sm text-on-surface-variant/80 font-inter leading-relaxed relative">{eventData.description}</p>
                )}
              </div>
            )}

            {/* Poll Preview */}
            {pollData && (
              <div className="mt-5 p-4 bg-surface-container-low rounded-xl border-l-3 border-tertiary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-tertiary/3 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-1.5 text-label-sm font-geist font-semibold text-tertiary uppercase tracking-wider mb-2.5 relative">
                  <Vote size={13} />
                  Poll
                </div>
                <p className="text-title-sm font-geist font-semibold text-on-surface mb-3 relative">{pollData.question}</p>
                <div className="space-y-2 relative">
                  {pollData.options.map((option, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/15 text-body-sm font-inter text-on-surface hover:border-primary/20 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-outline-variant/40 shrink-0" />
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
          </div>
        </div>
      </div>

      <EventDialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        onSave={setEventData}
        initial={eventData ?? undefined}
      />

      <PollDialog
        open={showPollDialog}
        onClose={() => setShowPollDialog(false)}
        onSave={setPollData}
        initial={pollData ?? undefined}
      />
    </div>
  )
}

/* ─── Toolbar Button Component ─── */
function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick?: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high/80 active:scale-95 transition-all duration-150 shrink-0"
      title={title}
    >
      {children}
    </button>
  )
}
