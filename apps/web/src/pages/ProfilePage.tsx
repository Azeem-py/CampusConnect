import { useState, useRef } from "react"
import { MapPin, Calendar, MoreHorizontal } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { Sidebar } from "../components/layout/Sidebar"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { Tag } from "../components/ui/Tag"
import { FeedTabs } from "../components/feed/FeedTabs"
import { FeedCard } from "../components/feed/FeedCard"
import { useAuth } from "../contexts/AuthContext"
import { useUserPosts } from "../services/posts"
import { useUpdateProfile, useUserProfile, useFollowUser, useUnfollowUser } from "../services/auth"

function formatJoinDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
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

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const urlUserId = searchParams.get("userId") || undefined
  const { user: currentUser } = useAuth()

  const { data: targetUser, isLoading: userLoading } = useUserProfile(urlUserId)
  const displayedUser = urlUserId ? targetUser : currentUser
  const isOwnProfile = !urlUserId || urlUserId === currentUser?.id

  const [activeTab, setActiveTab] = useState("posts")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Followers & Following state / mutations
  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()
  const isFollowing = currentUser?.following?.some((f: any) => f.id === displayedUser?.id)

  const handleFollowToggle = () => {
    if (!displayedUser?.id) return
    if (isFollowing) {
      unfollowUser.mutate(displayedUser.id)
    } else {
      followUser.mutate(displayedUser.id)
    }
  }

  // Dynamic Tabs list
  const tabs = [
    { id: "posts", label: isOwnProfile ? "My Posts" : "Posts" },
    { id: "media", label: "Media" },
    ...(isOwnProfile ? [{ id: "saved", label: "Saved Questions" }] : []),
  ]

  // File upload input refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Image previews
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || "")
  const [bannerPreview, setBannerPreview] = useState(currentUser?.banner || "")

  // Fetch posts based on tab
  const { data: postsData, isLoading: postsLoading } = useUserPosts(
    activeTab === "saved" ? undefined : displayedUser?.id,
    1,
    20,
    activeTab === "saved" ? displayedUser?.id : undefined
  )

  const updateProfileMutation = useUpdateProfile()

  // Form state for editing profile
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    bio: currentUser?.bio || "",
    school: currentUser?.school || "",
    department: currentUser?.department || "",
    major: currentUser?.major || "",
    hobby: currentUser?.hobby || "",
    interests: currentUser?.interests || "",
    avatar: currentUser?.avatar || "",
    banner: currentUser?.banner || "",
  })

  if (urlUserId && userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!displayedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant font-geist">User profile not found.</p>
      </div>
    )
  }

  // Filter posts with events or polls if the active tab is "media"
  const filteredPosts = postsData?.posts.filter((post) => {
    if (activeTab === "media") {
      return post.event !== null || post.poll !== null
    }
    return true
  }) ?? []

  const interests = displayedUser.interests?.split(",").map((s) => s.trim()).filter(Boolean) ?? []

  const handleOpenEditModal = () => {
    if (!currentUser) return
    setFormData({
      name: currentUser.name || "",
      username: currentUser.username || "",
      bio: currentUser.bio || "",
      school: currentUser.school || "",
      department: currentUser.department || "",
      major: currentUser.major || "",
      hobby: currentUser.hobby || "",
      interests: currentUser.interests || "",
      avatar: currentUser.avatar || "",
      banner: currentUser.banner || "",
    })
    setAvatarPreview(currentUser.avatar || "")
    setBannerPreview(currentUser.banner || "")
    setError(null)
    setIsEditModalOpen(true)
  }

  // Handle local avatar file conversion to Base64
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData(prev => ({ ...prev, avatar: base64String }))
      setAvatarPreview(base64String)
    }
    reader.readAsDataURL(file)
  }

  // Handle local banner file conversion to Base64
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData(prev => ({ ...prev, banner: base64String }))
      setBannerPreview(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        username: formData.username,
        bio: formData.bio || null,
        school: formData.school || null,
        department: formData.department || null,
        major: formData.major || null,
        hobby: formData.hobby || null,
        interests: formData.interests || null,
        avatar: formData.avatar || null,
        banner: formData.banner || null,
      })
      setIsEditModalOpen(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg overflow-hidden">
            {/* Banner Section */}
            <div 
              className="h-32 bg-gradient-to-r from-primary-container/40 to-primary/20 bg-cover bg-center"
              style={displayedUser.banner ? { backgroundImage: `url(${displayedUser.banner})` } : undefined}
            />

            <div className="px-4 pb-4">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <Avatar 
                  name={displayedUser.name} 
                  src={displayedUser.avatar ?? undefined} 
                  size="xl" 
                  className="border-2 border-surface shadow-md" 
                />
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  {isOwnProfile ? (
                    <Button variant="secondary" size="sm" onClick={handleOpenEditModal}>
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      variant={isFollowing ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleFollowToggle}
                      disabled={followUser.isPending || unfollowUser.isPending}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h1 className="font-geist font-bold text-display-md text-on-surface">{displayedUser.name}</h1>
                <p className="text-body-md text-on-surface-variant font-inter">{displayedUser.username}</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {displayedUser.department && <Tag variant="department">{displayedUser.department}</Tag>}
                {displayedUser.major && <Tag variant="skill">{displayedUser.major}</Tag>}
              </div>

              {displayedUser.bio && (
                <p className="mt-3 text-body-md text-on-surface font-inter leading-relaxed whitespace-pre-wrap">
                  {displayedUser.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 text-body-sm text-on-surface-variant font-inter">
                {displayedUser.school && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {displayedUser.school}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Joined {formatJoinDate(displayedUser.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-4 text-title-md font-geist">
                <span>
                  <strong className="text-on-surface">{displayedUser.reputationScore}</strong>{" "}
                  <span className="text-on-surface-variant font-normal">Reputation</span>
                </span>
              </div>
            </div>
          </div>

          <FeedTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="space-y-4">
            {postsLoading ? (
              <p className="text-center text-on-surface-variant py-8">Loading posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8 font-inter">
                {activeTab === "posts" && "No posts yet"}
                {activeTab === "media" && "No media posts yet"}
                {activeTab === "saved" && "No saved posts yet"}
              </p>
            ) : (
              filteredPosts.map((post) => (
                <FeedCard
                  key={post.id}
                  id={post.id}
                  author={{
                    id: post.author.id,
                    name: post.author.name,
                    handle: post.author.username,
                    avatar: post.author.avatar ?? undefined,
                  }}
                  departmentTag={post.courseCode ?? undefined}
                  timestamp={timeAgo(post.createdAt)}
                  content={post.content}
                  event={post.event}
                  poll={post.poll}
                  stats={{
                    likes: post._count.votes,
                    comments: post._count.comments,
                  }}
                />
              ))
            )}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2">
          {displayedUser.school && (
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-title-md font-geist font-semibold text-on-surface flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                  Institution
                </h3>
                <p className="mt-1 text-title-sm text-on-surface font-geist font-medium">{displayedUser.school}</p>
                {displayedUser.department && <p className="text-body-sm text-on-surface-variant font-inter">{displayedUser.department}</p>}
                {displayedUser.major && <p className="text-body-sm text-on-surface-variant font-inter">Major: {displayedUser.major}</p>}
              </div>
            </div>
          )}

          {interests.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-title-md font-geist font-semibold text-on-surface flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  Interests
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {interests.map((interest) => (
                    <Tag key={interest} variant="skill">{interest}</Tag>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/15 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface font-geist">Edit Profile</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-3.5 bg-error/10 border border-error/20 text-error text-sm rounded-lg font-inter">
                  {error}
                </div>
              )}

              {/* Twitter-style Avatar and Banner Image Selection Block */}
              <div className="relative mb-6">
                {/* Banner Upload Preview */}
                <div 
                  className="h-32 bg-surface-container bg-cover bg-center rounded-xl relative overflow-hidden group cursor-pointer border border-outline-variant/20 flex items-center justify-center transition-all duration-200 hover:brightness-95"
                  style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : undefined}
                  onClick={() => bannerInputRef.current?.click()}
                  title="Click to change banner photo"
                >
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                  {!bannerPreview && (
                    <span className="text-[11px] text-on-surface-variant font-semibold font-geist select-none uppercase tracking-wider">Click to upload banner photo</span>
                  )}
                  <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleBannerFileChange} 
                  />
                </div>

                {/* Avatar Upload Preview */}
                <div 
                  className="absolute -bottom-8 left-6 group cursor-pointer" 
                  onClick={() => avatarInputRef.current?.click()}
                  title="Click to change profile picture"
                >
                  <div className="relative">
                    <Avatar 
                      name={formData.name || currentUser?.name || ""} 
                      src={avatarPreview || undefined} 
                      size="xl" 
                      className="border-4 border-surface shadow-lg bg-surface-container" 
                    />
                    <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarFileChange} 
                  />
                </div>
              </div>
              
              {/* Spacer to push text inputs below the absolute avatar overlay */}
              <div className="h-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Institution / School</label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData(p => ({ ...p, school: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Major</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData(p => ({ ...p, major: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Hobby</label>
                  <input
                    type="text"
                    value={formData.hobby}
                    onChange={(e) => setFormData(p => ({ ...p, hobby: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-geist">Interests (Comma separated)</label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData(p => ({ ...p, interests: e.target.value }))}
                  placeholder="e.g. Machine Learning, Web Dev, Photography"
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-inter"
                />
              </div>

              {/* Footer actions */}
              <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
