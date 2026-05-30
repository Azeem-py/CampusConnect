import { useState, useCallback } from "react"
import {
  X, Hash, Calendar, Vote, Bold, Italic, Underline, Strikethrough,
  Link as LinkIcon, List, ListOrdered, Sigma, Image, Paperclip, Eye,
  XCircle,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { renderEnhancedPreview } from "../lib/latex"
import { MathKeyboard } from "../components/create/MathKeyboard"
import { EventDialog, type EventData } from "../components/create/EventDialog"
import { PollDialog, type PollData } from "../components/create/PollDialog"
import { useContentEditable } from "../hooks/useContentEditable"
import { useCreatePost } from "../services/posts"

export function CreatePostPage() {
  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 w-full border-b border-gray-200/80 flex justify-between items-center px-4 h-16 z-50">
        <Link
          to="/feed"
          className="flex items-center gap-2 cursor-pointer active:opacity-70 no-underline"
        >
          <X size={20} className="text-gray-400 hover:text-blue-600 transition-colors" />
          <span className="text-[14px] font-geist font-medium text-gray-400 hidden md:inline">
            Cancel
          </span>
        </Link>

        <span className="text-[20px] font-geist font-bold text-blue-700">
          Scholarsphere
        </span>

        <div className="flex items-center gap-3">
          {createPost.isError && (
            <span className="text-[12px] text-red-500 font-geist max-w-[200px] text-right leading-tight">
              {createPost.error?.message || 'Failed to post'}
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            className="text-white text-[15px] font-semibold px-5"
            disabled={isEmpty || createPost.isPending}
            loading={createPost.isPending}
            onClick={handlePost}
          >
            Post
          </Button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Avatar name="You" size="md" />

            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-blue-600">
              <Hash size={16} />
              CS-412
            </button>

            {eventData ? (
              <button
                onClick={() => setEventData(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-full border border-blue-300 text-[13px] font-geist font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                title="Remove event"
              >
                <Calendar size={16} />
                Event Added
                <XCircle size={14} />
              </button>
            ) : (
              <button
                onClick={() => setShowEventDialog(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-gray-500"
              >
                <Calendar size={16} />
                Add Event
              </button>
            )}

            {pollData ? (
              <button
                onClick={() => setPollData(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 rounded-full border border-amber-300 text-[13px] font-geist font-medium text-amber-700 hover:bg-amber-200 transition-colors"
                title="Remove poll"
              >
                <Vote size={16} />
                Poll Added
                <XCircle size={14} />
              </button>
            ) : (
              <button
                onClick={() => setShowPollDialog(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-gray-500"
              >
                <Vote size={16} />
                Add Poll
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 flex flex-col shadow-sm flex-grow">
            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
              <button onClick={handleBold} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Bold (Ctrl+B)">
                <Bold size={16} />
              </button>
              <button onClick={handleItalic} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Italic (Ctrl+I)">
                <Italic size={16} />
              </button>
              <button onClick={handleUnderline} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Underline (Ctrl+U)">
                <Underline size={16} />
              </button>
              <button onClick={handleStrikethrough} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Strikethrough (Ctrl+Shift+S)">
                <Strikethrough size={16} />
              </button>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <button onClick={handleLink} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Link (Ctrl+K)">
                <LinkIcon size={16} />
              </button>
              <button onClick={handleBulletList} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Bullet List">
                <List size={16} />
              </button>
              <button onClick={handleNumberedList} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Numbered List">
                <ListOrdered size={16} />
              </button>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <button
                onClick={() => setShowKeyboard((prev) => !prev)}
                className={[
                  "inline-flex items-center gap-1 px-2 py-1 rounded transition-colors ml-auto border",
                  showKeyboard
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
                ].join(" ")}
                title="Insert Math/LaTeX"
              >
                <Sigma size={18} />
                <span className="text-[13px] font-geist font-medium hidden sm:inline">Math Keyboard</span>
              </button>
            </div>

            {showKeyboard && <MathKeyboard onInsert={insertAtCursor} />}

            <div className="p-4 flex-grow flex flex-col min-h-[400px]">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                className="w-full flex-grow resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-[16px] text-gray-900 font-jetbrains-mono leading-relaxed p-0 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
                data-placeholder="What are your thoughts or findings? Start typing here... Use $$...$$ for LaTeX"
                role="textbox"
                aria-multiline="true"
              />
            </div>

            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-2">
                <button className="text-blue-600 hover:bg-gray-100 p-1.5 rounded transition-colors" title="Add Image">
                  <Image size={18} />
                </button>
                <button className="text-blue-600 hover:bg-gray-100 p-1.5 rounded transition-colors" title="Add File">
                  <Paperclip size={18} />
                </button>
              </div>
              <span className="text-[12px] font-mono text-gray-400">
                Markdown supported
              </span>
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-[400px] flex flex-col gap-4">
          <h2 className="flex items-center gap-1.5 text-[18px] font-geist font-semibold text-gray-900">
            <Eye size={20} className="text-gray-400" />
            Live Preview
          </h2>

          <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm h-full max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Avatar name="You" size="sm" />
              <div>
                <div className="text-[13px] font-geist font-bold text-gray-900">You</div>
                <div className="text-[11px] font-mono text-gray-400">Just now</div>
              </div>
            </div>

            <div className="text-[16px] text-gray-800 font-inter leading-relaxed space-y-3">
              {isEmpty ? (
                <p className="text-gray-400 italic">
                  Start typing to see your preview...
                </p>
              ) : (
                renderEnhancedPreview(plainContent)
              )}
            </div>

            {eventData && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-1.5 text-[12px] font-geist font-semibold text-blue-700 uppercase tracking-wide mb-2">
                  <Calendar size={14} />
                  Event
                </div>
                <p className="text-[14px] font-geist font-semibold text-gray-900">{eventData.title}</p>
                <div className="mt-1.5 space-y-0.5 text-[13px] text-gray-600 font-inter">
                  <p>
                    {new Date(eventData.date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}{eventData.time ? ` · ${new Date(`2000-01-01T${eventData.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </p>
                  {eventData.location && <p>📍 {eventData.location}</p>}
                </div>
                {eventData.description && (
                  <p className="mt-1.5 text-[13px] text-gray-500 font-inter">{eventData.description}</p>
                )}
              </div>
            )}

            {pollData && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-1.5 text-[12px] font-geist font-semibold text-amber-700 uppercase tracking-wide mb-2">
                  <Vote size={14} />
                  Poll
                </div>
                <p className="text-[14px] font-geist font-semibold text-gray-900 mb-2">{pollData.question}</p>
                <div className="space-y-1.5">
                  {pollData.options.map((option, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-amber-200/60 text-[13px] font-inter text-gray-700"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-amber-300 shrink-0" />
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

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
