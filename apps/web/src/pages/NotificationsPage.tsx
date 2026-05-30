import { useState, useMemo } from "react"
import {
  Bell,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  FlaskConical,
  CheckCheck,
  Bookmark,
  Calendar,
  Clock,
  Ellipsis,
} from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { Avatar } from "../components/ui/Avatar"
import { cn, formatDistanceToNow } from "../lib/utils"
import { useAuth } from "../contexts/AuthContext"
import { useUserPosts } from "../services/posts"

type NotifType = "like" | "follow" | "comment" | "repost" | "system" | "mention" | "bookmark"

interface Notification {
  id: string
  type: NotifType
  actor: string
  handle?: string
  action: string
  target?: string
  time: string
  timestamp: Date
  unread: boolean
}

type Tab = "all" | "unread" | "mentions" | "system"

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
  { id: "system", label: "System" },
]

const TYPE_STYLES: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  like: { icon: Heart, bg: "bg-red-500/10", color: "text-red-500" },
  follow: { icon: UserPlus, bg: "bg-primary/10", color: "text-primary" },
  comment: { icon: MessageCircle, bg: "bg-primary/10", color: "text-primary" },
  repost: { icon: Repeat2, bg: "bg-green-500/10", color: "text-green-600" },
  system: { icon: FlaskConical, bg: "bg-amber-500/10", color: "text-amber-600" },
  mention: { icon: Bell, bg: "bg-purple-500/10", color: "text-purple-600" },
  bookmark: { icon: Bookmark, bg: "bg-sky-500/10", color: "text-sky-600" },
}

function groupNotifications(list: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = []
  const today: Notification[] = []
  const yesterday: Notification[] = []
  const thisWeek: Notification[] = []
  const earlier: Notification[] = []

  const now = new Date()
  const day = 86400000
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - day)
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * day)

  for (const n of list) {
    const t = n.timestamp
    if (t >= startOfToday) today.push(n)
    else if (t >= startOfYesterday) yesterday.push(n)
    else if (t >= startOfWeek) thisWeek.push(n)
    else earlier.push(n)
  }

  if (today.length) groups.push({ label: "Today", items: today })
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday })
  if (thisWeek.length) groups.push({ label: "This Week", items: thisWeek })
  if (earlier.length) groups.push({ label: "Earlier", items: earlier })

  return groups
}

export function NotificationsPage() {
  const { user } = useAuth()
  const { data: postsData } = useUserPosts(user?.id)
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [markedRead, setMarkedRead] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const posts = postsData?.posts || []

  const dynamicNotifications = useMemo(() => {
    if (!user) return []

    const list: Notification[] = []

    // 1. Generate realistic notifications dynamically from the user's actual backend posts
    posts.forEach((post, index) => {
      const excerpt = post.content.length > 30 ? post.content.substring(0, 30) + "..." : post.content

      list.push({
        id: `like-${post.id}`,
        type: "like",
        actor: index % 2 === 0 ? "Dr. Arthur Pendelton" : "Dr. Elena Rostova",
        handle: index % 2 === 0 ? "@art_physics" : "@erostova",
        action: "liked your post",
        target: `"${excerpt}"`,
        time: formatDistanceToNow(post.createdAt),
        timestamp: new Date(post.createdAt),
        unread: index === 0,
      })

      list.push({
        id: `comment-${post.id}`,
        type: "comment",
        actor: index % 2 === 0 ? "CompSci Dept" : "Adebayo S.",
        handle: index % 2 === 0 ? "@stanford_cs" : "@adebayoscience",
        action: "commented on your post",
        target: `"${excerpt}"`,
        time: formatDistanceToNow(new Date(new Date(post.createdAt).getTime() + 10 * 60000).toISOString()),
        timestamp: new Date(new Date(post.createdAt).getTime() + 10 * 60000),
        unread: index === 0,
      })
    })

    // 2. Add welcoming and feature alert notifications utilizing real school/name details from the backend session
    list.push({
      id: "welcome-system",
      type: "system",
      actor: "Scholarsphere",
      action: `Welcome to Scholarsphere, ${user.name}! Complete your profile for ${user.school || "your campus"} to get discovered.`,
      time: formatDistanceToNow(user.createdAt),
      timestamp: new Date(user.createdAt),
      unread: false,
    })

    list.push({
      id: "system-latex",
      type: "system",
      actor: "Scholarsphere",
      action: "New feature: Live LaTeX preview now supports multi-line equations and mathematical matrices.",
      time: "2 days ago",
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      unread: false,
    })

    // Sort by timestamp descending
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [user, posts])

  const unreadCount = useMemo(() => {
    return dynamicNotifications.filter((n) => n.unread && !markedRead.has(n.id)).length
  }, [dynamicNotifications, markedRead])

  const filtered = useMemo(() => {
    let list = dynamicNotifications
    if (activeTab === "unread") {
      list = dynamicNotifications.filter((n) => n.unread && !markedRead.has(n.id))
    } else if (activeTab === "mentions") {
      list = dynamicNotifications.filter((n) => n.type === "mention")
    } else if (activeTab === "system") {
      list = dynamicNotifications.filter((n) => n.type === "system")
    }
    return groupNotifications(list)
  }, [activeTab, markedRead, dynamicNotifications])

  function markAllRead() {
    setMarkedRead(new Set(dynamicNotifications.map((n) => n.id)))
  }

  function toggleRead(id: string) {
    setMarkedRead((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-geist font-bold text-headline-md text-on-surface">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-on-primary text-label-sm font-geist font-semibold px-2 py-0.5 rounded-full min-w-[22px] text-center leading-tight">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-label-md text-primary font-geist font-medium hover:text-primary/80 transition-colors"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-surface-container-low rounded-lg p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-label-md font-geist font-medium transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-surface text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                <Bell size={24} className="text-on-surface-variant/60" />
              </div>
              <h3 className="font-geist font-semibold text-title-lg text-on-surface">
                {activeTab === "unread"
                  ? "All caught up!"
                  : activeTab === "mentions"
                    ? "No mentions yet"
                    : activeTab === "system"
                      ? "No system notifications"
                      : "No notifications"}
              </h3>
              <p className="text-body-sm text-on-surface-variant font-inter mt-1">
                {activeTab === "unread"
                  ? "You've read everything. Time to post something new."
                  : "When something comes in, it'll show up here."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((group) => (
                <section key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={13} className="text-on-surface-variant/50" />
                    <h2 className="text-title-sm font-geist font-semibold text-on-surface-variant/70 uppercase tracking-wider">
                      {group.label}
                    </h2>
                    <div className="flex-1 h-px bg-outline-variant/20" />
                  </div>

                  <div className="space-y-0.5">
                    {group.items.map((n, idx) => {
                      const isRead = !n.unread || markedRead.has(n.id)
                      const style = TYPE_STYLES[n.type]
                      const Icon = style.icon
                      const isHovered = hoveredId === n.id

                      return (
                        <div
                          key={n.id}
                          onMouseEnter={() => setHoveredId(n.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={() => toggleRead(n.id)}
                          className={cn(
                            "group relative flex items-start gap-3 p-3 pl-8 rounded-lg transition-all duration-150 cursor-pointer",
                            isRead
                              ? "hover:bg-surface-container/30"
                              : "bg-primary-container/5 hover:bg-primary-container/15"
                          )}
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          {!isRead && (
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}

                          <div className="shrink-0 mt-0.5">
                            {n.type === "system" || n.type === "mention" ? (
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  style.bg
                                )}
                              >
                                <Icon size={18} className={style.color} />
                              </div>
                            ) : (
                              <Avatar name={n.actor} size="sm" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-body-md text-on-surface font-inter leading-relaxed">
                              <span className="font-geist font-semibold">{n.actor}</span>{" "}
                              <span className="text-on-surface-variant/80">{n.action}</span>
                              {n.target && (
                                <span className="text-on-surface-variant/60"> {n.target}</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock size={11} className="text-on-surface-variant/40" />
                              <p className="text-body-sm text-on-surface-variant/60 font-inter">
                                {n.time}
                              </p>
                              {n.handle && (
                                <>
                                  <span className="text-on-surface-variant/20">·</span>
                                  <span className="text-body-sm text-on-surface-variant/40 font-inter">
                                    {n.handle}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRead(n.id)
                            }}
                            className={cn(
                              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
                              isHovered || isRead
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100",
                              isRead
                                ? "text-on-surface-variant/30 hover:text-on-surface-variant/60 hover:bg-surface-container"
                                : "text-primary hover:bg-primary/10"
                            )}
                          >
                            <Ellipsis size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              <button className="w-full py-3 text-label-md text-on-surface-variant/50 font-geist font-medium hover:text-on-surface-variant transition-colors border-t border-outline-variant/10">
                Load older notifications
              </button>
            </div>
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4">
            <h3 className="font-geist font-semibold text-title-md text-on-surface mb-2">
              Notification Settings
            </h3>
            <p className="text-body-sm text-on-surface-variant font-inter leading-relaxed">
              You're receiving notifications for likes, follows, comments, and mentions.
            </p>
            <button className="mt-3 text-label-sm text-primary font-geist font-medium hover:underline">
              Manage preferences →
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
