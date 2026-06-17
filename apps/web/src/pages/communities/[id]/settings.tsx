import { useParams } from "react-router-dom"
import { useCommunity, useUpdateCommunity, useDeleteCommunity, useTransferOwnership } from "../../../services/communities"
import { useAuth } from "../../../contexts/AuthContext"
import { ImageUpload } from "../../../components/ui/ImageUpload"
import { uploadPublicFile } from "../../../services/storage"
import { useState } from "react"
import type { CommunityJoinType } from "../../../services/communities"

export function CommunitySettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: community, isLoading } = useCommunity(id!)
  const updateCommunity = useUpdateCommunity(id!)
  const deleteCommunity = useDeleteCommunity()
  const transferOwnership = useTransferOwnership(id!)
  const [transferId, setTransferId] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [joinType, setJoinType] = useState<CommunityJoinType>("OPEN")
  const [isListed, setIsListed] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  if (!initialized && community) {
    setName(community.name)
    setDescription(community.description ?? "")
    setJoinType(community.joinType)
    setIsListed(community.isListed)
    setInitialized(true)
  }

  if (isLoading || !community) {
    return <div className="text-center py-12 text-on-surface-variant">Loading...</div>
  }

  const isOwner = community.ownerId === user?.id

  const handleSave = async () => {
    let avatarUrl: string | undefined | null = avatarFile ? (avatarPreview || null) : undefined
    let bannerUrl: string | undefined | null = bannerFile ? (bannerPreview || null) : undefined

    const isDev = import.meta.env.DEV
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

    if (!isDev && isSupabaseConfigured) {
      if (avatarFile) {
        avatarUrl = await uploadPublicFile("avatars", avatarFile)
      }
      if (bannerFile) {
        bannerUrl = await uploadPublicFile("banners", bannerFile)
      }
    }

    const payload: Record<string, unknown> = {
      name,
      description,
      joinType,
      isListed,
    }
    if (avatarUrl !== undefined) payload.avatar = avatarUrl
    if (bannerUrl !== undefined) payload.banner = bannerUrl

    await updateCommunity.mutateAsync(payload as Parameters<typeof updateCommunity.mutateAsync>[0])
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      await deleteCommunity.mutateAsync(id!)
    }
  }

  const handleTransfer = async () => {
    if (!transferId.trim()) return
    if (window.confirm(`Transfer ownership to user ${transferId}?`)) {
      await transferOwnership.mutateAsync({ targetUserId: transferId })
      setTransferId("")
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-title-md font-geist font-semibold text-on-surface mb-4">Community Settings</h2>
        <div className="space-y-4">
          <ImageUpload
            preview={avatarPreview || community.avatar}
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
          <ImageUpload
            preview={bannerPreview || community.banner}
            shape="rect"
            label="Community Banner"
            onChange={(file) => {
              if (file) {
                setBannerFile(file)
                const reader = new FileReader()
                reader.onload = () => setBannerPreview(reader.result as string)
                reader.readAsDataURL(file)
              } else {
                setBannerFile(null)
                setBannerPreview(null)
              }
            }}
          />
          <div>
            <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">Join Type</label>
            <select
              value={joinType}
              onChange={(e) => setJoinType(e.target.value as CommunityJoinType)}
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-colors"
            >
              <option value="OPEN">Open</option>
              <option value="REQUEST">Request</option>
              <option value="INVITE_ONLY">Invite Only</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-body-md text-on-surface cursor-pointer">
            <input
              type="checkbox"
              checked={isListed}
              onChange={(e) => setIsListed(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/30"
            />
            Listed in discovery
          </label>
          <button
            onClick={handleSave}
            disabled={updateCommunity.isPending}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {updateCommunity.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {isOwner && (
        <>
          <hr className="border-outline-variant/20" />
          <div>
            <h3 className="text-title-sm font-geist font-semibold text-error mb-3">Danger Zone</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-label-md font-geist font-medium text-on-surface mb-1.5">
                  Transfer Ownership
                </label>
                <p className="text-body-sm text-on-surface-variant mb-2">Enter the user ID of the new owner.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transferId}
                    onChange={(e) => setTransferId(e.target.value)}
                    placeholder="Target user ID"
                    className="flex-1 h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={handleTransfer}
                    disabled={transferOwnership.isPending || !transferId.trim()}
                    className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md font-geist font-medium hover:bg-outline-variant/40 disabled:opacity-50 transition-colors"
                  >
                    Transfer
                  </button>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleteCommunity.isPending}
                className="px-5 py-2.5 bg-error text-on-error rounded-lg text-label-md font-geist font-medium hover:brightness-110 disabled:opacity-50 transition-colors"
              >
                {deleteCommunity.isPending ? "Deleting..." : "Delete Community"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
