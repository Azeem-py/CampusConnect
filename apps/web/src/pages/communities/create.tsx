import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sidebar } from "../../components/layout/Sidebar"
import { ImageUpload } from "../../components/ui/ImageUpload"
import { useCreateCommunity } from "../../services/communities"
import { uploadPublicFile } from "../../services/storage"
import type { CommunityJoinType } from "../../services/communities"

export function CreateCommunityPage() {
  const navigate = useNavigate()
  const createCommunity = useCreateCommunity()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [joinType, setJoinType] = useState<CommunityJoinType>("OPEN")
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

    const result = await createCommunity.mutateAsync({ name, description, joinType, avatar: avatarUrl })
    navigate(`/communities/${result.id}`)
  }

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0">
          <h1 className="text-title-lg font-geist font-bold text-on-surface mb-6">Create Community</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUpload
              preview={avatarPreview}
              shape="circle"
              label="Community Avatar"
              onChange={(file) => {
                if (file) {
                  setAvatarFile(file)
                  const reader = new FileReader()
                  reader.onload = () => setAvatarPreview(reader.result as string)
                  reader.readAsDataURL(file)
                } else {
                  setAvatarFile(null)
                  setAvatarPreview(null)
                }
              }}
            />
            <div>
              <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Give your community a name"
                className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                rows={4}
                className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Join Type</label>
              <select
                value={joinType}
                onChange={(e) => setJoinType(e.target.value as CommunityJoinType)}
                className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors"
              >
                <option value="OPEN">Open — Anyone can join</option>
                <option value="REQUEST">Request — Approve or decline requests</option>
                <option value="INVITE_ONLY">Invite Only — Only admins can add</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={createCommunity.isPending || !name.trim()}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createCommunity.isPending ? "Creating..." : "Create Community"}
            </button>
            {createCommunity.isError && (
              <p className="text-body-sm text-error font-inter">{createCommunity.error?.message}</p>
            )}
          </form>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0" />
      </div>
    </div>
  )
}
