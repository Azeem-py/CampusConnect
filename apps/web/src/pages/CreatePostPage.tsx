import { useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft, Hash, Calendar, Vote, Bold, Italic, Underline, Strikethrough,
  Link as LinkIcon, List, ListOrdered, Sigma, Image, Paperclip, Eye,
  XCircle, Send, Crop, Trash2, BookOpen,
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
import { useCreatePost, useCourseCodes } from "../services/posts"
import { useAuth } from "../contexts/AuthContext"
import { useSearchScholars } from "../services/auth"
import { uploadPublicFile } from "../services/storage"
import { cn } from "../lib/utils"

export function CreatePostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createPost = useCreatePost()
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showPollDialog, setShowPollDialog] = useState(false)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault()
      const formatted = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
      if (formatted && !tags.includes(formatted) && tags.length < 10) {
        setTags((prev) => [...prev, formatted])
      }
      setTagInput("")
    } else if (e.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1))
    }
  }, [tagInput, tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }, [])

  // --- Course Code Picker State & Hooks ---
  const [courseCode, setCourseCode] = useState("")
  const [courseInput, setCourseInput] = useState("")
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const coursePickerRef = useRef<HTMLDivElement>(null)

  const { data: dbCourseCodes } = useCourseCodes()
  const fallbackPrefixes = ["CS-412", "CS-101", "MATH-201", "BIO-302", "PHYS-101", "CHEM-102", "STA-202"]
  const suggestions = ((dbCourseCodes && dbCourseCodes.length > 0) ? dbCourseCodes : fallbackPrefixes)
    .filter((code) => code.toLowerCase().includes(courseInput.toLowerCase()))
    .slice(0, 5)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (coursePickerRef.current && !coursePickerRef.current.contains(event.target as Node)) {
        setShowCoursePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // --- @Mention Autocomplete State & Hooks ---
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionCoords, setMentionCoords] = useState<{ top: number; left: number } | null>(null)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)

  const { data: searchedScholars } = useSearchScholars(mentionSearch || "", mentionSearch !== null)

  const {
    editorRef, plainContent, insertAtCursor,
    handleInput, handleKeyDown, handleMouseDown, isEmpty,
  } = useContentEditable()

  const getCaretCoordinates = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0).cloneRange()
    const rects = range.getClientRects()
    if (rects.length > 0) {
      return {
        top: rects[0].bottom + window.scrollY,
        left: rects[0].left + window.scrollX,
      }
    }
    const bounding = range.getBoundingClientRect()
    if (bounding.top !== 0 || bounding.left !== 0) {
      return {
        top: bounding.bottom + window.scrollY,
        left: bounding.left + window.scrollX,
      }
    }
    return null
  }

  const checkMentionTrigger = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      setMentionSearch(null)
      return
    }
    const node = sel.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      setMentionSearch(null)
      return
    }
    const text = node.textContent || ""
    const offset = sel.anchorOffset
    const textBeforeCursor = text.slice(0, offset)
    
    const lastAt = textBeforeCursor.lastIndexOf("@")
    if (lastAt !== -1) {
      const charBeforeAt = lastAt > 0 ? textBeforeCursor[lastAt - 1] : " "
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.slice(lastAt + 1)
        if (/^[a-zA-Z0-9_-]*$/.test(query)) {
          setMentionSearch(query)
          setActiveMentionIndex(0)
          const coords = getCaretCoordinates()
          if (coords) {
            setMentionCoords(coords)
          }
          return
        }
      }
    }
    setMentionSearch(null)
  }, [])

  const insertMention = useCallback((username: string) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const node = sel.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE) return
    
    const text = node.textContent || ""
    const offset = sel.anchorOffset
    const textBeforeCursor = text.slice(0, offset)
    const lastAt = textBeforeCursor.lastIndexOf("@")
    
    if (lastAt !== -1) {
      const startText = text.slice(0, lastAt)
      const endText = text.slice(offset)
      
      node.textContent = `${startText}@${username} ${endText}`
      
      const newOffset = lastAt + username.length + 2 // @ + username + space
      const newRange = document.createRange()
      newRange.setStart(node, newOffset)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
      
      editorRef.current?.focus()
      editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }))
    }
    
    setMentionSearch(null)
  }, [editorRef])

  const customKeyDown = useCallback((e: React.KeyboardEvent) => {
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
        return
      }
    }
    
    handleKeyDown(e)
  }, [mentionSearch, searchedScholars, activeMentionIndex, handleKeyDown, insertMention])

  const handleEditorInput = useCallback(() => {
    handleInput()
    setTimeout(checkMentionTrigger, 10)
  }, [handleInput, checkMentionTrigger])

  const [selectedImages, setSelectedImages] = useState<{ file: File | null; preview: string }[]>([])
  const [cropIndex, setCropIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      // 1. File size validation (5MB)
      const maxSizeBytes = 5 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" is too large. Each image must be under 5MB.`)
        return
      }
      // 2. File type validation (images/gifs, no video)
      if (!file.type.startsWith("image/") || file.type.startsWith("video/")) {
        alert(`File "${file.name}" has an invalid type. Only images and GIFs are allowed.`)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImages((prev) => {
          const nextImages = [...prev, { file, preview: reader.result as string }]
          // Automatically open cropper modal for the newly added image
          setCropIndex(nextImages.length - 1)
          return nextImages
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }, [])

  const handlePost = useCallback(async () => {
    setUploading(true)
    setUploadError("")
    try {
      const isDev = import.meta.env.DEV
      const isSupabaseConfigured = 
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

      const uploadedUrls: string[] = []

      for (const img of selectedImages) {
        if (!isDev && isSupabaseConfigured && img.file) {
          // Direct browser upload to Supabase CDN 'posts' folder
          const url = await uploadPublicFile("posts", img.file)
          uploadedUrls.push(url)
        } else {
          // Direct Base64 string fallback locally
          uploadedUrls.push(img.preview)
        }
      }

      createPost.mutate(
        {
          content: plainContent,
          status: 'PUBLISHED',
          courseCode: courseCode || undefined,
          event: eventData,
          poll: pollData,
          images: uploadedUrls,
          tags,
        },
        {
          onSuccess: () => navigate('/feed'),
          onError: () => setUploading(false)
        },
      )
    } catch (err: any) {
      console.error(err)
      setUploadError(err.message || "Failed to upload post attachments.")
      setUploading(false)
    }
  }, [plainContent, eventData, pollData, selectedImages, createPost, navigate, courseCode, tags])

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
                {uploadError && (
                  <span className="text-label-sm text-error font-geist max-w-[180px] text-right leading-tight hidden sm:inline">
                    {uploadError}
                  </span>
                )}
                <Button
                  variant="primary"
                  size="md"
                  className="font-semibold px-5 gap-2"
                  disabled={(isEmpty && selectedImages.length === 0) || createPost.isPending || uploading}
                  loading={createPost.isPending || uploading}
                  onClick={handlePost}
                  icon={<Send size={15} />}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
 
          {/* ─── Mobile Error Banner ─── */}
          {(createPost.isError || uploadError) && (
            <div className="sm:hidden mb-4 px-3 py-2 rounded-lg bg-error-container text-on-error-container text-label-sm font-geist">
              {uploadError || createPost.error?.message || 'Failed to post'}
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

            {courseCode ? (
              <button
                onClick={() => setCourseCode("")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/25 text-label-md font-geist font-medium text-primary hover:bg-primary/15 transition-all group"
                title="Remove Course Code"
              >
                <BookOpen size={14} />
                Course: {courseCode}
                <XCircle size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <div className="relative" ref={coursePickerRef}>
                <button
                  type="button"
                  onClick={() => setShowCoursePicker((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-outline-variant/20 transition-all text-label-md font-geist font-medium text-on-surface-variant hover:text-primary hover:border-primary/30 hover:bg-primary/5",
                    showCoursePicker && "border-primary/30 bg-primary/5 text-primary"
                  )}
                >
                  <BookOpen size={14} />
                  Add Course Code
                </button>

                {showCoursePicker && (
                  <div className="absolute left-0 mt-2 w-64 bg-surface-container-highest border border-outline-variant/25 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. CS-412"
                      value={courseInput}
                      onChange={(e) => setCourseInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && courseInput.trim()) {
                          setCourseCode(courseInput.trim());
                          setCourseInput("");
                          setShowCoursePicker(false);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-label-md font-geist bg-surface-container border border-outline-variant/30 focus:border-primary focus:outline-none rounded-xl text-on-surface placeholder:text-on-surface-variant/40 mb-2"
                    />
                    
                    <div className="text-label-sm font-semibold text-on-surface-variant/60 mb-1 px-1 select-none">
                      Suggestions
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCourseCode(code);
                            setCourseInput("");
                            setShowCoursePicker(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-label-md font-geist text-on-surface hover:bg-primary/10 hover:text-primary rounded-lg transition-colors leading-none"
                        >
                          {code}
                        </button>
                      ))}
                      {suggestions.length === 0 && (
                        <div className="text-body-sm text-on-surface-variant/40 italic px-1 py-1.5 select-none">
                          Type to create new...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                onInput={handleEditorInput}
                onKeyDown={customKeyDown}
                onMouseDown={handleMouseDown}
                onMouseUp={checkMentionTrigger}
                onKeyUp={checkMentionTrigger}
                className="w-full flex-grow resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-body-lg text-on-surface font-jetbrains-mono leading-relaxed p-0 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-variant/40 empty:before:font-inter empty:before:text-body-lg"
                data-placeholder="What are your thoughts or findings? Start typing here... Use $$...$$ for LaTeX"
                role="textbox"
                aria-multiline="true"
              />
            </div>

            {/* Interactive Hashtags Bar */}
            <div className="px-5 py-3 border-t border-outline-variant/10 bg-surface-container-low/20">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-label-sm font-geist font-medium text-on-surface-variant flex items-center gap-1 mr-1.5 select-none">
                  <Hash size={13} className="text-primary" />
                  Hashtags:
                </span>
                
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 text-label-sm font-medium font-geist text-primary animate-in zoom-in-95 duration-100"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary-dark transition-colors p-0.5 rounded-full"
                    >
                      <XCircle size={12} className="opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                ))}

                {tags.length < 10 && (
                  <div className="relative flex items-center">
                    <span className="text-label-sm text-primary/50 absolute left-2 select-none pointer-events-none font-medium">#</span>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length === 0 ? "add-tag..." : "add tag..."}
                      className="pl-4 pr-2 py-0.5 text-label-sm font-geist bg-transparent border-b border-dashed border-outline-variant/50 focus:border-primary focus:outline-none w-24 text-on-surface placeholder:text-on-surface-variant/30"
                    />
                  </div>
                )}
                
                {tags.length >= 10 && (
                  <span className="text-label-sm text-on-surface-variant/40 italic font-geist">Max 10 tags reached</span>
                )}
              </div>
            </div>

            {/* Attachment Preview panel */}
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 p-4 border-t border-outline-variant/12 bg-surface-container-low/30">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-outline-variant/15 overflow-hidden group shadow-sm hover:shadow transition-all duration-200 animate-in zoom-in-95 duration-150">
                    <img src={img.preview} alt="Attachment" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCropIndex(index)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white hover:scale-110 transition-all cursor-pointer"
                        title="Crop Image"
                      >
                        <Crop size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white hover:scale-110 transition-all cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Editor Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/12 glass-toolbar">
              <div className="flex gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <ToolbarBtn onClick={handleImageClick} title="Add Image">
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
              {isEmpty && selectedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-3">
                    <Eye size={20} className="text-on-surface-variant/40" />
                  </div>
                  <p className="text-on-surface-variant/50 text-body-md font-inter">
                    Start typing to see your preview...
                  </p>
                </div>
              ) : (
                <>
                  {plainContent && renderEnhancedPreview(plainContent)}

                  {/* Real-time Hashtags Preview */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-label-sm font-semibold font-geist text-primary hover:underline cursor-pointer transition-all duration-100 animate-in zoom-in-95 duration-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedImages.length > 0 && (
                    <div className={cn(
                      "grid gap-1.5 rounded-xl overflow-hidden mt-3 border border-outline-variant/10",
                      selectedImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {selectedImages.slice(0, 4).map((img, index) => {
                        const total = selectedImages.length
                        let gridClass = "h-28"
                        if (total === 1) gridClass = "w-full max-h-48 object-cover"
                        else if (total === 3 && index === 0) gridClass = "row-span-2 col-span-1 h-full min-h-[144px]"
                        else if (total === 3) gridClass = "col-span-1 h-[70px]"

                        return (
                          <div key={index} className={cn("relative overflow-hidden bg-surface-container-high/40", gridClass)}>
                            <img src={img.preview} alt="Preview attachment" className="w-full h-full object-cover" />
                            {total > 4 && index === 3 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-geist font-bold text-sm">
                                +{total - 3}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
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

      {cropIndex !== null && (
        <ImageCropperModal
          src={selectedImages[cropIndex].preview}
          fileName={selectedImages[cropIndex].file?.name || `post-image-${Date.now()}.png`}
          onClose={() => setCropIndex(null)}
          onSave={(croppedFile, croppedPreview) => {
            setSelectedImages(prev => prev.map((img, i) => i === cropIndex ? { file: croppedFile, preview: croppedPreview } : img))
            setCropIndex(null)
          }}
        />
      )}

      {mentionSearch !== null && searchedScholars && searchedScholars.length > 0 &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: mentionCoords ? mentionCoords.top + 20 : 0,
              left: mentionCoords ? mentionCoords.left : 0,
              zIndex: 9999,
            }}
            className="bg-surface-container-highest/85 backdrop-blur-lg border border-outline-variant/30 rounded-xl shadow-2xl p-1.5 w-64 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 font-geist"
          >
            {searchedScholars.map((scholar, idx) => (
              <button
                key={scholar.id}
                type="button"
                onClick={() => insertMention(scholar.username)}
                onMouseEnter={() => setActiveMentionIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150",
                  idx === activeMentionIndex
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-on-surface hover:bg-surface-container-high/60"
                )}
              >
                <Avatar
                  name={scholar.name ?? scholar.username}
                  src={scholar.avatar ?? undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-label-md font-semibold truncate leading-none">
                    {scholar.name || scholar.username}
                  </div>
                  <div className="text-body-sm text-on-surface-variant/70 truncate mt-0.5 leading-none">
                    @{scholar.username}
                  </div>
                </div>
              </button>
            ))}
          </div>,
          document.body
        )
      }
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

/* ─── Immersive Image Cropper Modal ─── */
interface ImageCropperModalProps {
  src: string
  fileName: string
  onClose: () => void
  onSave: (file: File, preview: string) => void
}

function ImageCropperModal({ src, fileName, onClose, onSave }: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerSize = 320

  const [dimensions, setDimensions] = useState({ width: 0, height: 0, dispW: 0, dispH: 0 })

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight
    const ratio = w / h

    let dispW = containerSize
    let dispH = containerSize

    if (ratio > 1) {
      dispW = containerSize * ratio
    } else {
      dispH = containerSize / ratio
    }

    setDimensions({ width: w, height: h, dispW, dispH })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    const w = dimensions.dispW * zoom
    const h = dimensions.dispH * zoom
    const maxX = Math.max(0, (w - containerSize) / 2)
    const maxY = Math.max(0, (h - containerSize) / 2)

    setPan({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const w = dimensions.dispW * zoom
    const h = dimensions.dispH * zoom
    const maxX = Math.max(0, (w - containerSize) / 2)
    const maxY = Math.max(0, (h - containerSize) / 2)

    setPan({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    })
  }

  const handleSave = () => {
    if (!imageRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = containerSize
    canvas.height = containerSize
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, containerSize, containerSize)

      const cx = containerSize / 2 + pan.x
      const cy = containerSize / 2 + pan.y
      const w = dimensions.dispW * zoom
      const h = dimensions.dispH * zoom

      ctx.drawImage(imageRef.current, cx - w / 2, cy - h / 2, w, h)

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9)
      const croppedFile = dataURLtoFile(croppedDataUrl, fileName)
      onSave(croppedFile, croppedDataUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface-container-lowest border border-outline-variant/60 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between">
          <h3 className="text-title-md font-bold text-on-surface font-geist">Crop Image</h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center gap-5">
          {/* Square Crop Frame Container */}
          <div 
            style={{ width: containerSize, height: containerSize }}
            className="overflow-hidden relative rounded-xl border border-outline-variant/30 bg-surface-container-high cursor-move select-none touch-none shadow-inner animate-[fadeIn_0.2s_ease]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={src}
              alt="Crop target"
              onLoad={handleImageLoad}
              style={{
                width: dimensions.dispW * zoom,
                height: dimensions.dispH * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                maxWidth: "none",
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
            />
            <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none rounded-xl" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-white/50" />
              <div className="border-r border-white/50" />
              <div />
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-label-sm font-geist text-on-surface-variant">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                const nextZoom = parseFloat(e.target.value)
                setZoom(nextZoom)
                
                const w = dimensions.dispW * nextZoom
                const h = dimensions.dispH * nextZoom
                const maxX = Math.max(0, (w - containerSize) / 2)
                const maxY = Math.max(0, (h - containerSize) / 2)
                
                setPan(prev => ({
                  x: Math.min(maxX, Math.max(-maxX, prev.x)),
                  y: Math.min(maxY, Math.max(-maxY, prev.y)),
                }))
              }}
              className="w-full accent-primary h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-outline-variant/15 flex items-center justify-end gap-3 bg-surface-container-low/30">
          <Button variant="outline" size="sm" onClick={onClose} className="px-4">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="px-4" style={{ color: "#ffffff" }}>
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}
