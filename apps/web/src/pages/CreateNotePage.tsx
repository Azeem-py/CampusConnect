import { useState, useRef, useCallback, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon,
  List, ListOrdered, Sigma, Image, X, Save, Trash2, Users,
  Globe, Lock, Plus, XCircle, Crop, ArrowLeft, Eye
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Avatar } from "../components/ui/Avatar"
import { ImageCropperModal } from "../components/ui/ImageCropperModal"
import { MathKeyboard } from "../components/create/MathKeyboard"
import { Sidebar } from "../components/layout/Sidebar"
import { useContentEditable } from "../hooks/useContentEditable"
import { useSearchScholars } from "../services/auth"
import { uploadPublicFile } from "../services/storage"
import { renderEnhancedPreview } from "../lib/latex"
import { cn } from "../lib/utils"
import {
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useShareNote,
  useRemoveNoteAccess,
  type CreateNotePayload,
  type UpdateNotePayload,
  type NoteAccess,
} from "../services/notes"

export function CreateNotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: note, isLoading: noteLoading } = useNote(id)
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const shareNote = useShareNote()
  const removeAccess = useRemoveNoteAccess()

  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [selectedImages, setSelectedImages] = useState<{ file: File | null; preview: string }[]>([])
  const [cropIndex, setCropIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [shareSearch, setShareSearch] = useState("")
  const [selectedShareUsers, setSelectedShareUsers] = useState<{ id: string; name: string | null; username: string; avatar: string | null }[]>([])
  const [sharePermission, setSharePermission] = useState<"READ" | "WRITE">("READ")

  const { data: searchResults } = useSearchScholars(shareSearch, shareSearch.length >= 1)
  const sharedWith: NoteAccess[] = note?.sharedWith || []

  const {
    editorRef, plainContent, insertAtCursor,
    handleInput, handleKeyDown, handleMouseDown, isEmpty,
  } = useContentEditable()

  // Initialize page state when editing note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title || "")
      setIsPublic(note.isPublic || false)
      if (note.images) {
        setSelectedImages(note.images.map((url) => ({ file: null, preview: url })))
      }
      if (editorRef.current && !editorRef.current.textContent) {
        editorRef.current.innerHTML = note.content
        handleInput()
      }
    }
  }, [note, editorRef, handleInput])

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

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const maxSizeBytes = 5 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" is too large. Each image must be under 5MB.`)
        return
      }
      if (!file.type.startsWith("image/") || file.type.startsWith("video/")) {
        alert(`File "${file.name}" has an invalid type. Only images are allowed.`)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImages((prev) => {
          const nextImages = [...prev, { file, preview: reader.result as string }]
          setCropIndex(nextImages.length - 1)
          return nextImages
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }, [])

  const handleSave = async () => {
    const isDev = import.meta.env.DEV
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

    setSaving(true)
    try {
      const uploadedUrls: string[] = []
      for (const img of selectedImages) {
        if (!isDev && isSupabaseConfigured && img.file) {
          const url = await uploadPublicFile("notes", img.file)
          uploadedUrls.push(url)
        } else {
          uploadedUrls.push(img.preview)
        }
      }

      const payload = {
        title: title || undefined,
        content: plainContent,
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        isPublic,
      }

      if (isEditing) {
        await updateNote.mutateAsync({ id: id!, payload: payload as UpdateNotePayload })
        navigate(`/notes/${id}`)
      } else {
        await createNote.mutateAsync(payload as CreateNotePayload)
        navigate("/profile?tab=notes")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing || !window.confirm("Are you sure you want to delete this note?")) return
    setDeleting(true)
    try {
      await deleteNote.mutateAsync(id!)
      navigate("/profile?tab=notes")
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    if (selectedShareUsers.length === 0 || !isEditing) return
    try {
      await shareNote.mutateAsync({
        id: id!,
        payload: {
          userIds: selectedShareUsers.map((u) => u.id),
          permission: sharePermission,
        },
      })
      setSelectedShareUsers([])
      setShareSearch("")
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveAccess = async (targetUserId: string) => {
    if (!isEditing) return
    try {
      await removeAccess.mutateAsync({ id: id!, targetUserId })
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddShareUser = (user: { id: string; name: string | null; username: string; avatar: string | null }) => {
    if (!selectedShareUsers.find((u) => u.id === user.id)) {
      setSelectedShareUsers((prev) => [...prev, user])
    }
    setShareSearch("")
  }

  const handleRemoveShareUser = (userId: string) => {
    setSelectedShareUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const charCount = plainContent.length

  if (isEditing && noteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        {/* ─── Sidebar ─── */}
        <Sidebar />

        {/* ─── Page Content ─── */}
        <div className="flex-1 min-w-0">
          {/* ─── Contextual Action Bar ─── */}
          <div className="sticky top-14 z-40 glass-toolbar border border-outline-variant/15 rounded-xl mb-5">
            <div className="flex items-center justify-between h-14 px-4 lg:px-5">
              <Link
                to={isEditing ? `/notes/${id}` : "/profile?tab=notes"}
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors no-underline group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-label-md font-geist font-medium hidden sm:inline">
                  {isEditing ? "Back to Note" : "Back to Profile"}
                </span>
              </Link>

              <h1 className="text-title-md font-geist font-semibold text-on-surface">
                {isEditing ? "Edit Note" : "New Note"}
              </h1>

              <div className="flex items-center gap-3">
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10 font-semibold px-4 gap-1.5"
                    disabled={saving || deleting}
                    loading={deleting}
                    onClick={handleDelete}
                    icon={<Trash2 size={14} />}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  className="font-semibold px-5 gap-2"
                  disabled={(isEmpty && selectedImages.length === 0) || saving || deleting}
                  loading={saving}
                  onClick={handleSave}
                  icon={<Save size={15} />}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <div className="flex flex-col lg:flex-row gap-6 animate-slide-up">
            {/* ─── Editor Column ─── */}
            <section className="flex-1 flex flex-col gap-5 min-w-0">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title (optional)"
                  className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-inter"
                />
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
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-label-md font-geist font-medium ml-auto shrink-0",
                      showKeyboard
                        ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary",
                    )}
                    title="Math/LaTeX Keyboard"
                  >
                    <Sigma size={16} />
                    <span className="hidden sm:inline">Math</span>
                  </button>
                </div>

                {/* Math Keyboard */}
                {showKeyboard && <MathKeyboard onInsert={insertAtCursor} />}

                {/* Content Editable Area */}
                <div className="p-5 flex-grow flex flex-col min-h-[300px] lg:min-h-[380px]">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onMouseDown={handleMouseDown}
                    className="w-full flex-grow resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-body-lg text-on-surface font-jetbrains-mono leading-relaxed p-0 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-variant/40 empty:before:font-inter empty:before:text-body-lg"
                    data-placeholder="Write your personal notes here... Use $$...$$ for LaTeX"
                    role="textbox"
                    aria-multiline="true"
                  />
                </div>

                {/* Image Attachments */}
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
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-label-sm font-mono text-on-surface-variant/50 select-none tabular-nums">
                      {charCount > 0 ? `${charCount.toLocaleString()} chars` : "Markdown & LaTeX supported"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Privacy Setting Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl transition-colors",
                    isPublic ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                  )}>
                    {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-geist font-semibold text-on-surface">
                      {isPublic ? "Public" : "Private"}
                    </p>
                    <p className="text-xs text-on-surface-variant font-inter mt-0.5">
                      {isPublic
                        ? "Anyone visiting your profile can see this note"
                        : "Only you and people you share with can see this note"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-all duration-300",
                    isPublic ? "bg-primary" : "bg-surface-container-high"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300",
                    isPublic ? "left-6" : "left-0.5"
                  )} />
                </button>
              </div>

              {/* Share Card (Only visible when editing) */}
              {isEditing && (
                <div className="rounded-2xl border border-outline-variant/15 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSharePanel(!showSharePanel)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-on-surface-variant" />
                      <span className="text-sm font-geist font-semibold text-on-surface">
                        Share with others
                      </span>
                      {sharedWith.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-geist font-semibold">
                          {sharedWith.length}
                        </span>
                      )}
                    </div>
                    <ChevronIcon open={showSharePanel} />
                  </button>

                  {showSharePanel && (
                    <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/10 pt-3">
                      {sharedWith.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-geist font-bold text-on-surface-variant/60 uppercase tracking-wider">
                            People with access
                          </p>
                          {sharedWith.map((access: NoteAccess) => (
                            <div key={access.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-container-low/50">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  name={access.user?.name || access.user?.username || "?"}
                                  src={access.user?.avatar || undefined}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-sm font-geist font-medium text-on-surface">
                                    {access.user?.name || access.user?.username}
                                  </p>
                                  <p className="text-[11px] text-on-surface-variant/60 font-inter">
                                    {access.permission === "WRITE" ? "Can edit" : "Can view"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAccess(access.userId)}
                                className="p-1 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={shareSearch}
                              onChange={(e) => setShareSearch(e.target.value)}
                              placeholder="Search users by name..."
                              className="w-full bg-surface-container border border-outline-variant/15 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-inter"
                            />
                            {searchResults && searchResults.length > 0 && shareSearch && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-highest border border-outline-variant/25 rounded-xl shadow-xl p-1.5 z-50 max-h-48 overflow-y-auto">
                                {searchResults.map((user: any) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleAddShareUser(user)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-left transition-colors"
                                  >
                                    <Avatar
                                      name={user.name || user.username}
                                      src={user.avatar || undefined}
                                      size="sm"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-geist font-medium text-on-surface truncate">
                                        {user.name || user.username}
                                      </p>
                                      <p className="text-xs text-on-surface-variant/60 truncate">
                                        @{user.username}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <select
                            value={sharePermission}
                            onChange={(e) => setSharePermission(e.target.value as "READ" | "WRITE")}
                            className="bg-surface-container border border-outline-variant/15 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-inter cursor-pointer appearance-none animate-none"
                          >
                            <option value="READ">View only</option>
                            <option value="WRITE">Can edit</option>
                          </select>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="shrink-0"
                            onClick={handleShare}
                            disabled={selectedShareUsers.length === 0}
                          >
                            <Plus size={14} /> Share
                          </Button>
                        </div>

                        {selectedShareUsers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedShareUsers.map((user) => (
                              <span
                                key={user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-geist font-semibold"
                              >
                                {user.name || user.username}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveShareUser(user.id)}
                                  className="hover:bg-primary/20 rounded-full p-0.5"
                                >
                                  <X size={10} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ─── Live Preview Column ─── */}
            <aside className="w-full lg:w-[380px] xl:w-[400px] flex flex-col gap-4 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-8.5rem)]">
              <h2 className="flex items-center gap-2 text-title-md font-geist font-semibold text-on-surface">
                <div className="p-1.5 rounded-lg bg-primary/8">
                  <Eye size={16} className="text-primary" />
                </div>
                Live Preview
              </h2>

              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5 shadow-sm flex-grow overflow-y-auto scrollbar-thin-styled">
                {title && (
                  <h1 className="text-title-lg font-geist font-bold text-on-surface mb-3 border-b border-outline-variant/10 pb-2">
                    {title}
                  </h1>
                )}
                <div className="text-body-lg text-on-surface font-inter leading-relaxed space-y-3">
                  {isEmpty && selectedImages.length === 0 && !title ? (
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
              </div>
            </aside>
          </div>
        </div>
      </div>

      {cropIndex !== null && (
        <ImageCropperModal
          src={selectedImages[cropIndex].preview}
          fileName={selectedImages[cropIndex].file?.name || `note-image-${Date.now()}.png`}
          onClose={() => setCropIndex(null)}
          onSave={(croppedFile: File, croppedPreview: string) => {
            setSelectedImages((prev) =>
              prev.map((img, i) => (i === cropIndex ? { file: croppedFile, preview: croppedPreview } : img))
            )
            setCropIndex(null)
          }}
        />
      )}
    </div>
  )
}

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
      type="button"
    >
      {children}
    </button>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-on-surface-variant/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
