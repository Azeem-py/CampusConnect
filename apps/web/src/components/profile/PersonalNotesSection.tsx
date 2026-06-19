import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Plus, Globe, Lock, Users, Edit3, Trash2, Clock } from "lucide-react"
import { Button } from "../ui/Button"
import { renderEnhancedPreview } from "../../lib/latex"
import {
  useMyNotes,
  useUserPublicNotes,
  useDeleteNote,
  type PersonalNote,
} from "../../services/notes"

interface PersonalNotesSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

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

function getNotePreview(note: PersonalNote): string {
  if (note.title) return note.title
  const firstLine = note.content.split("\n")[0]?.replace(/<[^>]*>/g, "") || ""
  return firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine || "Untitled"
}

export function PersonalNotesSection({ userId, isOwnProfile }: PersonalNotesSectionProps) {
  const navigate = useNavigate()
  const myNotesQuery = useMyNotes()
  const publicNotesQuery = useUserPublicNotes(isOwnProfile ? undefined : userId)
  const notes = isOwnProfile ? myNotesQuery.data : publicNotesQuery.data
  const isLoading = isOwnProfile ? myNotesQuery.isLoading : publicNotesQuery.isLoading

  const deleteNote = useDeleteNote()
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openViewer = (note: PersonalNote) => {
    navigate(`/notes/${note.id}`)
  }

  const openEditor = (note: PersonalNote) => {
    navigate(`/notes/${note.id}/edit`)
  }

  const openNewNote = () => {
    navigate("/notes/create")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto">
          <FileText size={28} className="text-on-surface-variant/40" />
        </div>
        <div>
          <p className="text-on-surface-variant font-inter">
            {isOwnProfile
              ? "You haven't created any personal notes yet"
              : "No public notes"}
          </p>
        </div>
        {isOwnProfile && (
          <Button variant="primary" size="sm" onClick={openNewNote} icon={<Plus size={15} />}>
            Create your first note
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isOwnProfile && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-title-md font-geist font-semibold text-on-surface">
            My Notes
          </h3>
          <Button variant="primary" size="sm" onClick={openNewNote} icon={<Plus size={15} />}>
            New Note
          </Button>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-start justify-between gap-4">
            <button
              onClick={() => openViewer(note)}
              className="flex-1 min-w-0 text-left cursor-pointer"
            >
              <h4 className="text-title-sm font-geist font-semibold text-on-surface truncate">
                {getNotePreview(note)}
              </h4>
              <div className="text-body-sm text-on-surface-variant font-inter mt-1 line-clamp-2 overflow-hidden max-h-11 leading-relaxed prose-sm max-w-none">
                {renderEnhancedPreview(note.content.length > 250 ? note.content.slice(0, 250) + "..." : note.content)}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant/60 font-inter">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {timeAgo(note.updatedAt)}
                </span>
                {note.isPublic ? (
                  <span className="flex items-center gap-1 text-primary/60">
                    <Globe size={11} />
                    Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Lock size={11} />
                    Private
                  </span>
                )}
                {note.sharedWith && note.sharedWith.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {note.sharedWith.length} shared
                  </span>
                )}
                {note.images && note.images.length > 0 && (
                  <span>{note.images.length} image{note.images.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </button>

            {isOwnProfile && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => openEditor(note)}
                  className="text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 h-8 w-8"
                  title="Edit note"
                  icon={<Edit3 size={14} />}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => setConfirmDelete(note.id)}
                  className="text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 h-8 w-8"
                  title="Delete note"
                  icon={<Trash2 size={14} />}
                />
              </div>
            )}
          </div>

          {/* Delete confirmation */}
          {confirmDelete === note.id && (
            <div className="mt-3 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-inter">
                Are you sure you want to delete this note?
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs py-1 px-3"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="text-xs py-1 px-3 !bg-error !hover:bg-error/90"
                  loading={deleteNote.isPending && deletingNoteId === note.id}
                  onClick={async () => {
                    setDeletingNoteId(note.id)
                    await deleteNote.mutateAsync(note.id)
                    setConfirmDelete(null)
                    setDeletingNoteId(null)
                  }}
                  icon={<Trash2 size={12} />}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
