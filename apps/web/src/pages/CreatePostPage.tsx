import { useState, useCallback } from "react"
import {
  X, Hash, Calendar, Vote, Bold, Italic, Underline, Strikethrough,
  Link as LinkIcon, List, ListOrdered, Sigma, Image, Paperclip, Eye,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { renderEnhancedPreview } from "../lib/latex"
import { MathKeyboard } from "../components/create/MathKeyboard"
import { useContentEditable } from "../hooks/useContentEditable"

export function CreatePostPage() {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const {
    editorRef, plainContent, insertAtCursor,
    handleInput, handleKeyDown, handleMouseDown, isEmpty,
  } = useContentEditable()

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

        <Button variant="primary" size="sm" disabled={isEmpty}>
          Post
        </Button>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Avatar name="You" size="md" />

            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-blue-600">
              <Hash size={16} />
              CS-412
            </button>

            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-gray-500">
              <Calendar size={16} />
              Add Event
            </button>

            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 hover:border-blue-400 transition-colors text-[13px] font-geist font-medium text-gray-500">
              <Vote size={16} />
              Add Poll
            </button>
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
          </div>
        </aside>
      </main>
    </div>
  )
}
