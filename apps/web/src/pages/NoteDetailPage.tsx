import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft, Edit3, Globe, Lock, Users, Clock, Eye, Trash2
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Avatar } from "../components/ui/Avatar"
import { Sidebar } from "../components/layout/Sidebar"
import { renderEnhancedPreview } from "../lib/latex"
import { cn } from "../lib/utils"
import {
  useNote,
  useDeleteNote,
  type NoteAccess,
} from "../services/notes"
import { useAuth } from "../contexts/AuthContext"

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const { data: note, isLoading: noteLoading } = useNote(id)
  const deleteNote = useDeleteNote()
  const [deleting, setDeleting] = useState(false)

  const isOwner = note?.userId === currentUser?.id
  const hasWriteAccess = isOwner || note?.sharedWith?.some(
    (access) => access.userId === currentUser?.id && access.permission === "WRITE"
  )

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return
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

  if (noteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center py-12 space-y-4">
          <p className="text-on-surface-variant font-geist">Note not found.</p>
          <Link to="/profile?tab=notes" className="text-primary hover:underline">
            Back to profile
          </Link>
        </div>
      </div>
    )
  }

  const sharedWith = note.sharedWith || []

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
                to="/profile?tab=notes"
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors no-underline group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-label-md font-geist font-medium hidden sm:inline">
                  Back to Profile
                </span>
              </Link>

              <h1 className="text-title-md font-geist font-semibold text-on-surface">
                View Note
              </h1>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10 font-semibold px-2.5 sm:px-3.5 gap-1.5"
                    disabled={deleting}
                    loading={deleting}
                    onClick={handleDelete}
                    icon={<Trash2 size={14} />}
                  >
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                )}
                {hasWriteAccess && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-semibold px-3 sm:px-5 gap-1.5"
                    onClick={() => navigate(`/notes/${id}/edit`)}
                    icon={<Edit3 size={14} />}
                  >
                    <span className="hidden sm:inline">Edit Note</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <div className="flex flex-col lg:flex-row gap-6 animate-slide-up">
            {/* ─── Note Document Column ─── */}
            <main className="flex-1 min-w-0">
              <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 md:p-8 shadow-sm space-y-6">
                {/* Header */}
                <div className="space-y-3 border-b border-outline-variant/10 pb-5">
                  <h1 className="text-2xl md:text-3xl font-geist font-bold text-on-surface leading-tight">
                    {note.title || "Untitled Note"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant/70 font-inter">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      Last updated {timeAgo(note.updatedAt)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/40" />
                    {note.isPublic ? (
                      <span className="flex items-center gap-1.5 text-primary">
                        <Globe size={13} />
                        Public note
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Lock size={13} />
                        Private note
                      </span>
                    )}
                    {sharedWith.length > 0 && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/40" />
                        <span className="flex items-center gap-1.5 text-primary">
                          <Users size={13} />
                          Shared with {sharedWith.length} scholar{sharedWith.length > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Rendered with LaTeX & formatting */}
                <div className="text-body-lg text-on-surface font-inter leading-relaxed space-y-4 prose prose-indigo max-w-none">
                  {renderEnhancedPreview(note.content)}
                </div>

                {/* Image Attachments Gallery */}
                {note.images && note.images.length > 0 && (
                  <div className="pt-6 border-t border-outline-variant/10">
                    <h3 className="text-label-md font-geist font-bold text-on-surface-variant/60 uppercase tracking-wider mb-3 select-none">
                      Attachments ({note.images.length})
                    </h3>
                    <div className={cn(
                      "grid gap-3 rounded-2xl overflow-hidden border border-outline-variant/12 bg-surface-container-low/20 p-2",
                      note.images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
                    )}>
                      {note.images.map((img, index) => (
                        <a 
                          key={index} 
                          href={img} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/10 group shadow-sm bg-surface-container-high"
                        >
                          <img src={img} alt="Attachment" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs text-white bg-black/60 rounded-full px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-sm">
                              <Eye size={12} /> View Full Image
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </main>

            {/* ─── Share / Metadata Panel (Only visible to owner) ─── */}
            {isOwner && sharedWith.length > 0 && (
              <aside className="w-full lg:w-[320px] xl:w-[350px] space-y-4">
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-title-sm font-geist font-bold text-on-surface flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    People with Access
                  </h3>
                  <div className="space-y-3 pt-2 border-t border-outline-variant/10">
                    {sharedWith.map((access: NoteAccess) => (
                      <div key={access.id} className="flex items-center gap-2.5 py-1">
                        <Avatar
                          name={access.user?.name || access.user?.username || "?"}
                          src={access.user?.avatar || undefined}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-geist font-medium text-on-surface truncate">
                            {access.user?.name || access.user?.username}
                          </p>
                          <p className="text-[11px] text-on-surface-variant/60 font-inter">
                            {access.permission === "WRITE" ? "Can edit" : "Can view"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
