import { useState, useRef, useCallback, useEffect } from "react"
import {
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon,
  List, ListOrdered, Sigma, Image, X, Save, Trash2, Users,
  Globe, Lock, Plus, XCircle, Crop,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Avatar } from "../ui/Avatar"
import { ImageCropperModal } from "../ui/ImageCropperModal"
import { MathKeyboard } from "../create/MathKeyboard"
import { useContentEditable } from "../../hooks/useContentEditable"
import { useSearchScholars } from "../../services/auth"
import { uploadPublicFile } from "../../services/storage"
import { cn } from "../../lib/utils"
import type {
  PersonalNote,
  CreateNotePayload,
  UpdateNotePayload,
  ShareNotePayload,
  NoteAccess,
} from "../../services/notes"

interface NoteEditorModalProps {
  note?: PersonalNote | null
  onSave: (payload: CreateNotePayload | UpdateNotePayload) => Promise<void>
  onDelete?: () => Promise<void>
  onShare?: (payload: ShareNotePayload) => Promise<void>
  onRemoveAccess?: (targetUserId: string) => Promise<void>
  onClose: () => void
  saving?: boolean
  deleting?: boolean
}

export function NoteEditorModal({
  note,
  onSave,
  onDelete,
  onShare,
  onRemoveAccess,
  onClose,
  saving,
  deleting,
}: NoteEditorModalProps) {
  const isEditing = !!note
  const [title, setTitle] = useState(note?.title || "")
  const [isPublic, setIsPublic] = useState(note?.isPublic || false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)

  const [selectedImages, setSelectedImages] = useState<{ file: File | null; preview: string }[]>(
    note?.images?.map((url: string) => ({ file: null, preview: url })) || []
  )
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

  useEffect(() => {
    if (isEditing && note?.content && editorRef.current) {
      if (!editorRef.current.textContent) {
        editorRef.current.innerHTML = note.content
        handleInput()
      }
    }
  }, [isEditing, note, editorRef, handleInput])

  const charCount = plainContent.length

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

    const uploadedUrls: string[] = []
    for (const img of selectedImages) {
      if (!isDev && isSupabaseConfigured && img.file) {
        const url = await uploadPublicFile("notes", img.file)
        uploadedUrls.push(url)
      } else {
        uploadedUrls.push(img.preview)
      }
    }

    await onSave({
      title: title || undefined,
      content: plainContent,
      images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      isPublic,
    } as CreateNotePayload | UpdateNotePayload)
  }

  const handleShare = async () => {
    if (selectedShareUsers.length === 0 || !onShare) return
    await onShare({
      userIds: selectedShareUsers.map((u) => u.id),
      permission: sharePermission,
    })
    setSelectedShareUsers([])
    setShareSearch("")
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/15 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-on-surface font-geist">
            {isEditing ? "Edit Note" : "New Note"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all h-8 w-8"
            icon={<X size={20} />}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex flex-col shadow-sm flex-grow overflow-hidden">
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-outline-variant/12 overflow-x-auto">
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

              <Button
                variant={showKeyboard ? "primary" : "ghost"}
                size="sm"
                onClick={() => setShowKeyboard((prev) => !prev)}
                className={cn(
                  "ml-auto shrink-0 text-label-md font-geist font-medium",
                  showKeyboard
                    ? "bg-primary/12 text-primary hover:bg-primary/15"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                )}
                title="Math/LaTeX Keyboard"
                icon={<Sigma size={16} />}
              >
                <span className="hidden sm:inline">Math</span>
              </Button>
            </div>

            {showKeyboard && <MathKeyboard onInsert={insertAtCursor} />}

            <div className="p-5 flex-grow min-h-[250px]">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                className="w-full min-h-[200px] resize-none border-none focus:outline-none focus:ring-0 bg-transparent text-body-lg text-on-surface font-jetbrains-mono leading-relaxed p-0 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-variant/40 empty:before:font-inter"
                data-placeholder="Write your personal notes here... Use $$...$$ for LaTeX"
                role="textbox"
                aria-multiline="true"
              />
            </div>

            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 p-4 border-t border-outline-variant/12 bg-surface-container-low/30">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-outline-variant/15 overflow-hidden group shadow-sm">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCropIndex(index)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white transition-all"
                      >
                        <Crop size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/12">
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
              <span className="text-label-sm font-mono text-on-surface-variant/50 select-none tabular-nums">
                {charCount > 0 ? `${charCount.toLocaleString()} chars` : "Start typing..."}
              </span>
            </div>
          </div>

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

          {isEditing && onShare && (
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            iconOnly
                            onClick={() => onRemoveAccess?.(access.userId)}
                            className="text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors h-7 w-7"
                            icon={<XCircle size={14} />}
                          />
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
                            {searchResults.map((user: { id: string; name: string | null; username: string; avatar: string | null }) => (
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
                        className="bg-surface-container border border-outline-variant/15 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-inter cursor-pointer appearance-none"
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
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between shrink-0">
          <div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-error hover:bg-error/10 rounded-xl px-4"
                onClick={onDelete}
                loading={deleting}
                disabled={saving}
              >
                <Trash2 size={15} /> Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold font-geist"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="rounded-xl px-6 py-2.5 text-sm font-semibold font-geist shadow-md"
              onClick={handleSave}
              loading={saving}
              disabled={deleting || (isEmpty && selectedImages.length === 0)}
              icon={<Save size={15} />}
            >
              Save
            </Button>
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
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      onClick={onClick}
      className="p-2 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high/80 active:scale-95 transition-all duration-150 shrink-0 h-8 w-8"
      title={title}
      icon={children}
    />
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
