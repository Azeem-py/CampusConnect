import { useState } from "react"
import { Dialog } from "../../../../components/ui/Dialog"
import { useCreateGroup } from "../../../../services/communities"
import { uploadPublicFile } from "../../../../services/storage"
import { Plus } from "lucide-react"

interface CreateGroupDialogProps {
  communityId: string
  open: boolean
  onClose: () => void
}

export function CreateGroupDialog({ communityId, open, onClose }: CreateGroupDialogProps) {
  const createGroup = useCreateGroup(communityId)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let avatarUrl: string | undefined = avatarPreview || undefined

    const isDev = import.meta.env.DEV
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

    if (!isDev && isSupabaseConfigured && avatarFile) {
      avatarUrl = await uploadPublicFile("avatars", avatarFile)
    }

    await createGroup.mutateAsync({ name, description, avatar: avatarUrl })
    setName("")
    setDescription("")
    setAvatarFile(null)
    setAvatarPreview(null)
    onClose()
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setAvatarFile(null)
    setAvatarPreview(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high cursor-pointer border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors flex items-center justify-center group"
            onClick={() => document.getElementById("create-group-avatar-input")?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Group avatar" className="w-full h-full object-cover" />
            ) : (
              <Plus size={24} className="text-on-surface-variant/50 group-hover:text-primary/60 transition-colors" />
            )}
            <input
              id="create-group-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setAvatarFile(file)
                const reader = new FileReader()
                reader.onload = () => setAvatarPreview(reader.result as string)
                reader.readAsDataURL(file)
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-label-sm font-geist font-medium text-on-surface mb-1.5">Group Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Study Group, Project Team"
            className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-label-sm font-geist font-medium text-on-surface mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this group for?"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-10 bg-surface-container text-on-surface rounded-lg text-label-sm font-geist font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createGroup.isPending || !name.trim()}
            className="flex-1 h-10 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {createGroup.isPending ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
