import { useState, useRef } from "react"
import { 
  MapPin, 
  Calendar, 
  MoreHorizontal,
  Camera,
  X,
  Plus,
  User,
  FileText,
  School,
  GraduationCap,
  BookOpen,
  Heart,
  Sparkles,
  Trash2,
  Upload,
  Globe
} from "lucide-react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Sidebar } from "../components/layout/Sidebar"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { Tag } from "../components/ui/Tag"
import { FeedTabs } from "../components/feed/FeedTabs"
import { FeedCard } from "../components/feed/FeedCard"
import { useAuth } from "../contexts/AuthContext"
import { useUserPosts, useBookmarkedPosts } from "../services/posts"
import { useUpdateProfile, useUserProfile, useFollowUser, useUnfollowUser, type ConnectionUser } from "../services/auth"
import { uploadPublicFile } from "../services/storage"

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

const DEPARTMENTS = [
  { value: "aeronautics", label: "Aeronautics & Astronautics" },
  { value: "biology", label: "Biology" },
  { value: "business", label: "Business & Management" },
  { value: "chemistry", label: "Chemistry" },
  { value: "civil-eng", label: "Civil Engineering" },
  { value: "comp-sci", label: "Computer Science" },
  { value: "data-science", label: "Data Science" },
  { value: "design", label: "Design" },
  { value: "economics", label: "Economics" },
  { value: "electrical-eng", label: "Electrical Engineering" },
  { value: "finance", label: "Finance" },
  { value: "law", label: "Law" },
  { value: "mathematics", label: "Mathematics" },
  { value: "mechanical-eng", label: "Mechanical Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "neuroscience", label: "Neuroscience" },
  { value: "physics", label: "Physics" },
  { value: "political-sci", label: "Political Science" },
  { value: "psychology", label: "Psychology" },
  { value: "software-eng", label: "Software Engineering" },
]

const UNIVERSITIES = [
  { value: "harvard", label: "Harvard University" },
  { value: "mit", label: "MIT" },
  { value: "stanford", label: "Stanford University" },
  { value: "oxford", label: "University of Oxford" },
  { value: "cambridge", label: "University of Cambridge" },
  { value: "caltech", label: "Caltech" },
  { value: "berkeley", label: "UC Berkeley" },
  { value: "eth-zurich", label: "ETH Zurich" },
  { value: "princeton", label: "Princeton University" },
  { value: "yale", label: "Yale University" },
  { value: "columbia", label: "Columbia University" },
  { value: "nyu", label: "New York University" },
  { value: "toronto", label: "University of Toronto" },
  { value: "national-singapore", label: "National University of Singapore" },
  { value: "tsinghua", label: "Tsinghua University" },
  { value: "other", label: "Other Institution" },
]

const PRESET_INTERESTS = [
  "Machine Learning",
  "Quantum Physics",
  "Cybersecurity",
  "Creative Writing",
  "Biotechnology",
  "Astrophysics",
  "Game Development",
  "Macroeconomics",
  "Sustainable Energy",
  "Organic Chemistry",
  "Data Science",
  "Robotics",
  "Ancient History",
  "Philosophy",
  "Cognitive Science",
]

const PRESET_HOBBIES = [
  "Photography",
  "Chess",
  "Rock Climbing",
  "Cooking",
  "Hiking",
  "Painting",
  "Playing Guitar",
  "Gardening",
  "Cycling",
  "Video Games",
  "Running",
  "Yoga",
  "Reading",
  "Sketching",
  "Table Tennis",
]

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

  const navigate = useNavigate()
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false)
  const [connectionsModalTab, setConnectionsModalTab] = useState<"following" | "followers">("following")

  const handleOpenConnectionsModal = (tab: "following" | "followers") => {
    setConnectionsModalTab(tab)
    setIsConnectionsModalOpen(true)
  }

  const handleModalFollowToggle = (userItem: any) => {
    const isItemFollowing = currentUser?.following?.some((f: any) => f.id === userItem.id)
    if (isItemFollowing) {
      unfollowUser.mutate(userItem.id)
    } else {
      followUser.mutate(userItem.id)
    }
  }

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  // Drag and drop state
  const [isAvatarDragging, setIsAvatarDragging] = useState(false)
  const [isBannerDragging, setIsBannerDragging] = useState(false)

  // Interests and Hobbies state for modal
  const [modalInterests, setModalInterests] = useState<string[]>([])
  const [modalHobbies, setModalHobbies] = useState<string[]>([])
  const [customInterestInput, setCustomInterestInput] = useState("")
  const [customHobbyInput, setCustomHobbyInput] = useState("")

  // Modal navigation tab
  const [modalTab, setModalTab] = useState<"personal" | "academic">("personal")

  // Fetch posts based on tab
  const savedQuery = useBookmarkedPosts(1, 20)
  const postsQuery = useUserPosts(
    activeTab === "saved" ? undefined : displayedUser?.id,
    1,
    20,
    undefined
  )

  const postsData = activeTab === "saved" ? savedQuery.data : postsQuery.data
  const postsLoading = activeTab === "saved" ? savedQuery.isLoading : postsQuery.isLoading

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
    setAvatarFile(null)
    setBannerFile(null)
    setModalInterests(
      currentUser.interests
        ? currentUser.interests.split(",").map((i) => i.trim()).filter(Boolean)
        : []
    )
    setModalHobbies(
      currentUser.hobby
        ? currentUser.hobby.split(",").map((h) => h.trim()).filter(Boolean)
        : []
    )
    setModalTab("personal")
    setCustomInterestInput("")
    setCustomHobbyInput("")
    setError(null)
    setIsEditModalOpen(true)
  }

  // Handle local file selection with validations
  const handleFileChange = (name: "avatar" | "banner", file: File | null) => {
    if (!file) return
    setError(null)

    // 1. File size validation (5MB)
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError("File size exceeds the 5MB limit.")
      return
    }

    // 2. File type validation (no videos, GIFs allowed)
    if (!file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setError("Invalid file type. Only images and GIFs are allowed.")
      return
    }

    // Store raw File object
    if (name === "avatar") {
      setAvatarFile(file)
    } else {
      setBannerFile(file)
    }

    // Keep base64 string for preview
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      setFormData(prev => ({ ...prev, [name]: base64String }))
      if (name === "avatar") {
        setAvatarPreview(base64String)
      } else {
        setBannerPreview(base64String)
      }
    }
    reader.readAsDataURL(file)
  }

  // Drag and Drop helpers
  const handleDragOver = (e: React.DragEvent, type: "avatar" | "banner") => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(true)
    } else {
      setIsBannerDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent, type: "avatar" | "banner") => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(false)
    } else {
      setIsBannerDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: "avatar" | "banner") => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(false)
    } else {
      setIsBannerDragging(false)
    }

    const file = e.dataTransfer.files?.[0] || null
    if (file) {
      handleFileChange(type, file)
    }
  }

  const handleClearAvatar = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setAvatarFile(null)
    setFormData(prev => ({ ...prev, avatar: "" }))
    setAvatarPreview("")
  }

  const handleClearBanner = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setBannerFile(null)
    setFormData(prev => ({ ...prev, banner: "" }))
    setBannerPreview("")
  }

  const addInterest = (interest: string) => {
    const trimmed = interest.trim()
    if (!trimmed) return
    if (modalInterests.includes(trimmed)) return
    setModalInterests(prev => [...prev, trimmed])
  }

  const removeInterest = (interest: string) => {
    setModalInterests(prev => prev.filter(i => i !== interest))
  }

  const addHobby = (hobby: string) => {
    const trimmed = hobby.trim()
    if (!trimmed) return
    if (modalHobbies.includes(trimmed)) return
    setModalHobbies(prev => [...prev, trimmed])
  }

  const removeHobby = (hobby: string) => {
    setModalHobbies(prev => prev.filter(h => h !== hobby))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      let finalAvatarUrl = formData.avatar
      let finalBannerUrl = formData.banner

      const isDev = import.meta.env.DEV
      const isSupabaseConfigured = 
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

      // Conditional upload: direct browser upload in production with CDN config, Base64 locally
      if (!isDev && isSupabaseConfigured) {
        if (avatarFile) {
          finalAvatarUrl = await uploadPublicFile("avatars", avatarFile)
        }
        if (bannerFile) {
          finalBannerUrl = await uploadPublicFile("banners", bannerFile)
        }
      }

      await updateProfileMutation.mutateAsync({
        name: formData.name,
        username: formData.username,
        bio: formData.bio || null,
        school: formData.school || null,
        department: formData.department || null,
        major: formData.major || null,
        hobby: modalHobbies.length > 0 ? modalHobbies.join(", ") : null,
        interests: modalInterests.length > 0 ? modalInterests.join(", ") : null,
        avatar: finalAvatarUrl || null,
        banner: finalBannerUrl || null,
      })
      setIsEditModalOpen(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update profile. Please try again.")
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

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-title-sm font-geist border-t border-outline-variant/10 pt-4">
                <button 
                  onClick={() => handleOpenConnectionsModal("following")}
                  className="hover:underline text-left group flex items-center gap-1.5 focus:outline-none"
                >
                  <strong className="text-on-surface font-semibold text-body-md group-hover:text-primary transition-colors">
                    {displayedUser.following?.length ?? 0}
                  </strong>{" "}
                  <span className="text-on-surface-variant font-normal text-body-sm">Following</span>
                </button>
                <button 
                  onClick={() => handleOpenConnectionsModal("followers")}
                  className="hover:underline text-left group flex items-center gap-1.5 focus:outline-none"
                >
                  <strong className="text-on-surface font-semibold text-body-md group-hover:text-primary transition-colors">
                    {displayedUser.followers?.length ?? 0}
                  </strong>{" "}
                  <span className="text-on-surface-variant font-normal text-body-sm">Followers</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <strong className="text-on-surface font-semibold text-body-md">
                    {displayedUser.reputationScore}
                  </strong>{" "}
                  <span className="text-on-surface-variant font-normal text-body-sm">Reputation</span>
                </div>
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
                    shares: post._count.reposts,
                  }}
                  votes={post.votes}
                  bookmarks={post.bookmarks}
                  originalPost={post.originalPost}
                  originalPostId={post.originalPostId}
                />
              ))
            )}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-on-surface font-geist flex items-center gap-2">
                  <Sparkles className="text-primary animate-pulse" size={20} />
                  Customize Profile
                </h2>
                <p className="text-xs text-on-surface-variant font-inter mt-0.5">Elevate your campus identity</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200 hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-outline-variant/10 px-6 bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setModalTab("personal")}
                className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold font-geist border-b-2 transition-all relative ${
                  modalTab === "personal"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <User size={16} />
                Personal Identity
                {modalTab === "personal" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalTab("academic")}
                className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold font-geist border-b-2 transition-all relative ${
                  modalTab === "academic"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <GraduationCap size={16} />
                Academic & Hobbies
                {modalTab === "academic" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                )}
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface-container-lowest/30">
                {error && (
                  <div className="p-3.5 bg-error/10 border border-error/20 text-error text-sm rounded-xl font-inter flex items-center gap-2 animate-in slide-in-from-top-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                  </div>
                )}

                {modalTab === "personal" ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Banner and Avatar customization card */}
                    <div className="relative mb-8">
                      <span className="text-[11px] font-geist font-bold text-on-surface-variant/50 uppercase tracking-widest block mb-2">Visual Assets</span>
                      
                      {/* Banner Upload Preview */}
                      <div 
                        className={`h-36 w-full rounded-2xl relative overflow-hidden group cursor-pointer border-2 transition-all duration-300 flex items-center justify-center ${
                          isBannerDragging 
                            ? "border-primary border-dashed bg-primary/15 scale-[0.99] shadow-inner" 
                            : "border-outline-variant/20 hover:border-primary/50"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "banner")}
                        onDragLeave={(e) => handleDragLeave(e, "banner")}
                        onDrop={(e) => handleDrop(e, "banner")}
                        onClick={() => bannerInputRef.current?.click()}
                        title="Click or drag to change banner photo"
                      >
                        {bannerPreview ? (
                          <>
                            <img src={bannerPreview} alt="Cover Banner" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:scale-110 transition-transform shadow-lg border border-white/20">
                                <Camera size={20} />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearBanner}
                              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-error text-white transition-all duration-200 z-20 hover:scale-105 hover:rotate-12 border border-white/10"
                              title="Clear banner photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-violet-600/25 via-indigo-600/15 to-purple-600/20 flex flex-col items-center justify-center p-4">
                            <Upload size={22} className="text-primary mb-1.5 animate-bounce" />
                            <span className="text-xs text-on-surface font-semibold font-geist uppercase tracking-wider">Upload Cover Banner</span>
                            <span className="text-[10px] text-on-surface-variant/70 font-inter mt-0.5">Drag & drop or click (5MB Limit)</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={bannerInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleFileChange("banner", e.target.files?.[0] || null)} 
                        />
                      </div>

                      {/* Avatar Upload Preview */}
                      <div 
                        className={`absolute -bottom-10 left-6 group cursor-pointer transition-all duration-300 ${
                          isAvatarDragging ? "scale-105" : "hover:scale-[1.02]"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "avatar")}
                        onDragLeave={(e) => handleDragLeave(e, "avatar")}
                        onDrop={(e) => handleDrop(e, "avatar")}
                        onClick={() => avatarInputRef.current?.click()}
                        title="Click or drag to change profile picture"
                      >
                        <div className="relative">
                          <Avatar 
                            name={formData.name || currentUser?.name || ""} 
                            src={avatarPreview || undefined} 
                            size="xl" 
                            className={`border-4 border-surface shadow-2xl bg-surface-container transition-all duration-300 ${
                              isAvatarDragging ? "ring-4 ring-primary ring-dashed" : "ring-1 ring-black/10"
                            }`} 
                          />
                          <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20">
                              <Camera size={16} />
                            </div>
                          </div>
                          {avatarPreview && (
                            <button
                              type="button"
                              onClick={handleClearAvatar}
                              className="absolute -top-1 -right-1 p-1.5 rounded-full bg-black/70 hover:bg-error text-white transition-all duration-200 z-20 shadow-md border border-white/10 hover:scale-105"
                              title="Clear profile picture"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={avatarInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleFileChange("avatar", e.target.files?.[0] || null)} 
                        />
                      </div>
                    </div>
                    
                    {/* Spacer */}
                    <div className="h-4" />

                    {/* Inputs */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name Input */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                            <User size={12} className="text-primary" /> Full Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Alex Rivera"
                              className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter"
                            />
                          </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                            <Globe size={12} className="text-primary" /> Username
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 text-on-surface-variant/50 font-inter text-sm font-semibold select-none">@</span>
                            <input
                              type="text"
                              required
                              value={formData.username.replace(/^@/, '')}
                              onChange={(e) => setFormData(p => ({ ...p, username: `@${e.target.value}` }))}
                              placeholder="alex_rivera"
                              className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl pl-8 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio Input */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                            <FileText size={12} className="text-primary" /> Biography
                          </label>
                          <span className={`text-[10px] font-inter ${
                            (formData.bio?.length || 0) > 140 ? "text-warning" : "text-on-surface-variant/40"
                          }`}>
                            {formData.bio?.length || 0} / 160
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={160}
                          value={formData.bio}
                          onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                          className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter resize-none leading-relaxed"
                          placeholder="Passionate researcher, developer, and student at Scholarsphare..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* School Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                          <School size={12} className="text-primary" /> Institution / School
                        </label>
                        <div className="relative">
                          <select
                            value={formData.school}
                            onChange={(e) => setFormData(p => ({ ...p, school: e.target.value }))}
                            className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter cursor-pointer appearance-none"
                          >
                            <option value="">Select University</option>
                            {UNIVERSITIES.map(u => (
                              <option key={u.value} value={u.label}>{u.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-3.5 pointer-events-none text-on-surface-variant/50">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Department Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                          <GraduationCap size={12} className="text-primary" /> Department
                        </label>
                        <div className="relative">
                          <select
                            value={formData.department}
                            onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                            className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter cursor-pointer appearance-none"
                          >
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map(d => (
                              <option key={d.value} value={d.label}>{d.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-3.5 pointer-events-none text-on-surface-variant/50">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Major Field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-geist flex items-center gap-1.5">
                        <BookOpen size={12} className="text-primary" /> Academic Major
                      </label>
                      <input
                        type="text"
                        value={formData.major}
                        onChange={(e) => setFormData(p => ({ ...p, major: e.target.value }))}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full bg-surface-container border border-outline-variant/15 hover:border-primary/45 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:shadow transition-all duration-200 font-inter"
                      />
                    </div>

                    {/* Hobbies Interactive Tag Selector */}
                    <div className="space-y-3 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-secondary-container text-on-secondary-container text-primary shadow-sm">
                          <Sparkles size={14} />
                        </div>
                        <div>
                          <h4 className="font-geist font-bold text-sm text-on-surface">Hobbies & Extracurriculars</h4>
                          <p className="text-[11px] text-on-surface-variant font-inter">Select what you enjoy in your spare time</p>
                        </div>
                      </div>

                      {/* Selected Hobbies Tags */}
                      {modalHobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 py-0.5">
                          {modalHobbies.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-geist font-semibold bg-primary/10 text-primary border border-primary/20 transition-all duration-200 animate-in zoom-in-75"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeHobby(tag)}
                                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                              >
                                <X size={10} strokeWidth={2.5} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Custom Hobby Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom hobby (e.g. Violin, Hiking)..."
                          value={customHobbyInput}
                          onChange={(e) => setCustomHobbyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (customHobbyInput.trim()) {
                                addHobby(customHobbyInput)
                                setCustomHobbyInput("")
                              }
                            }
                          }}
                          className="flex-1 bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-inter placeholder:text-on-surface-variant/40"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="py-1 px-3.5 text-xs font-geist rounded-xl"
                          onClick={() => {
                            if (customHobbyInput.trim()) {
                              addHobby(customHobbyInput)
                              setCustomHobbyInput("")
                            }
                          }}
                          disabled={!customHobbyInput.trim()}
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>

                      {/* Suggestions list */}
                      <div>
                        <span className="text-[10px] font-geist font-bold text-on-surface-variant/50 uppercase tracking-widest block mb-1.5">Preset Suggestions</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {PRESET_HOBBIES.filter(tag => !modalHobbies.includes(tag)).map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => addHobby(tag)}
                              className="px-2.5 py-1 rounded-full text-xs font-geist font-semibold border border-outline-variant/20 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-on-surface-variant/80 duration-150 active:scale-95"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interests Interactive Tag Selector */}
                    <div className="space-y-3 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-secondary-container text-on-secondary-container text-primary shadow-sm">
                          <Heart size={14} />
                        </div>
                        <div>
                          <h4 className="font-geist font-bold text-sm text-on-surface">Academic Interests</h4>
                          <p className="text-[11px] text-on-surface-variant font-inter">What fields of science or arts excite you?</p>
                        </div>
                      </div>

                      {/* Selected Interests Tags */}
                      {modalInterests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 py-0.5">
                          {modalInterests.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-geist font-semibold bg-primary/10 text-primary border border-primary/20 transition-all duration-200 animate-in zoom-in-75"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeInterest(tag)}
                                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                              >
                                <X size={10} strokeWidth={2.5} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Custom Interest Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom interest (e.g. AI Ethics, Physics)..."
                          value={customInterestInput}
                          onChange={(e) => setCustomInterestInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (customInterestInput.trim()) {
                                addInterest(customInterestInput)
                                setCustomInterestInput("")
                              }
                            }
                          }}
                          className="flex-1 bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-inter placeholder:text-on-surface-variant/40"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="py-1 px-3.5 text-xs font-geist rounded-xl"
                          onClick={() => {
                            if (customInterestInput.trim()) {
                              addInterest(customInterestInput)
                              setCustomInterestInput("")
                            }
                          }}
                          disabled={!customInterestInput.trim()}
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>

                      {/* Suggestions list */}
                      <div>
                        <span className="text-[10px] font-geist font-bold text-on-surface-variant/50 uppercase tracking-widest block mb-1.5">Preset Suggestions</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {PRESET_INTERESTS.filter(tag => !modalInterests.includes(tag)).map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => addInterest(tag)}
                              className="px-2.5 py-1 rounded-full text-xs font-geist font-semibold border border-outline-variant/20 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-on-surface-variant/80 duration-150 active:scale-95"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest/80 backdrop-blur-md">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold font-geist transition-all"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold font-geist shadow-md hover:shadow-lg transition-all"
                  loading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Connections (Following/Followers) Modal */}
      {isConnectionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/15 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Tabs Header */}
            <div className="border-b border-outline-variant/10 flex flex-col">
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface font-geist">
                  {displayedUser.name}'s Network
                </h2>
                <button 
                  onClick={() => setIsConnectionsModalOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex px-4">
                <button
                  onClick={() => setConnectionsModalTab("following")}
                  className={`flex-1 py-3 text-center font-geist font-medium text-sm border-b-2 transition-all ${
                    connectionsModalTab === "following"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Following ({displayedUser.following?.length ?? 0})
                </button>
                <button
                  onClick={() => setConnectionsModalTab("followers")}
                  className={`flex-1 py-3 text-center font-geist font-medium text-sm border-b-2 transition-all ${
                    connectionsModalTab === "followers"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Followers ({displayedUser.followers?.length ?? 0})
                </button>
              </div>
            </div>

            {/* List Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 min-h-[250px]">
              {(() => {
                const list = connectionsModalTab === "following" ? displayedUser.following : displayedUser.followers;
                if (!list || list.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant/40 mb-3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      <p className="text-sm text-on-surface-variant font-inter">
                        No {connectionsModalTab} yet.
                      </p>
                    </div>
                  )
                }

                return list.map((userItem: ConnectionUser) => {
                  const isOwnItem = userItem.id === currentUser?.id;
                  const itemIsFollowing = currentUser?.following?.some((f: any) => f.id === userItem.id);

                  return (
                    <div 
                      key={userItem.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container/40 transition-colors border border-transparent hover:border-outline-variant/10 group/item"
                    >
                      <div 
                        onClick={() => {
                          setIsConnectionsModalOpen(false);
                          navigate(`/profile?userId=${userItem.id}`);
                        }}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <Avatar 
                          name={userItem.name} 
                          src={userItem.avatar ?? undefined} 
                          size="md" 
                        />
                        <div className="min-w-0">
                          <h4 className="font-geist font-semibold text-sm text-on-surface group-hover/item:text-primary transition-colors truncate">
                            {userItem.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-inter truncate">
                            {userItem.username}
                          </p>
                          {(userItem.school || userItem.department) && (
                            <p className="text-[11px] text-on-surface-variant/80 font-inter mt-0.5 truncate">
                              {[userItem.school, userItem.department].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isOwnItem && currentUser && (
                        <Button
                          variant={itemIsFollowing ? "secondary" : "primary"}
                          size="sm"
                          className="py-1 px-3 text-xs"
                          onClick={() => handleModalFollowToggle(userItem)}
                          disabled={followUser.isPending || unfollowUser.isPending}
                        >
                          {itemIsFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
