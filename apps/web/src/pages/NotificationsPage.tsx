import { useState, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  FlaskConical,
  CheckCheck,
  Calendar,
  Clock,
  Ellipsis,
  Reply,
  Loader2,
} from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { Avatar } from "../components/ui/Avatar"
import { cn, formatDistanceToNow } from "../lib/utils"
import { useNotificationContext } from "../contexts/NotificationContext"
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  type NotificationItem as NotificationItemType,
} from "../services/notifications"

type Tab = "all" | "unread" | "mentions" | "system"

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
  { id: "system", label: "System" },
]

const TYPE_STYLES: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  LIKE: { icon: Heart, bg: "bg-red-500/10", color: "text-red-500" },
  LIKE_COMMENT: { icon: Heart, bg: "bg-red-500/10", color: "text-red-500" },
  FOLLOW: { icon: UserPlus, bg: "bg-primary/10", color: "text-primary" },
  COMMENT: { icon: MessageCircle, bg: "bg-primary/10", color: "text-primary" },
  REPLY: { icon: Reply, bg: "bg-primary/10", color: "text-primary" },
  REPOST: { icon: Repeat2, bg: "bg-green-500/10", color: "text-green-600" },
  SYSTEM: { icon: FlaskConical, bg: "bg-amber-500/10", color: "text-amber-600" },
  MENTION: { icon: Bell, bg: "bg-purple-500/10", color: "text-purple-600" },
}

const TYPE_LABELS: Record<string, string> = {
  LIKE: "liked your post",
  LIKE_COMMENT: "liked your comment",
  COMMENT: "commented on your post",
  REPLY: "replied to your comment",
  REPOST: "reposted your post",
  FOLLOW: "followed you",
  MENTION: "mentioned you",
  SYSTEM: "",
}

function groupNotifications(list: NotificationItemType[]) {
  const groups: { label: string; items: NotificationItemType[] }[] = []
  const today: NotificationItemType[] = []
  const yesterday: NotificationItemType[] = []
  const thisWeek: NotificationItemType[] = []
  const earlier: NotificationItemType[] = []

  const now = new Date()
  const day = 86400000
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - day)
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * day)

  for (const n of list) {
    const t = new Date(n.createdAt)
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
  const { unreadCount } = useNotificationContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [page, setPage] = useState(1)

  const filters = useMemo(() => {
    if (activeTab === "unread") return { unread: true }
    if (activeTab === "mentions") return { type: "MENTION" }
    if (activeTab === "system") return { type: "SYSTEM" }
    return {}
  }, [activeTab])

  const { data, isLoading } = useNotifications(page, 20, filters)
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()
  const deleteMutation = useDeleteNotification()

  const notifications = data?.notifications ?? []
  const totalPages = data?.totalPages ?? 1

  const grouped = useMemo(() => groupNotifications(notifications), [notifications])

  function handleMarkAllRead() {
    markAllAsReadMutation.mutate()
  }

  const getNotificationLink = useCallback((n: NotificationItemType) => {
    if (n.type === "FOLLOW" && n.actorId) return `/profile/${n.actorId}`
    if (n.postId) return `/post/${n.postId}`
    return null
  }, [])

  function handleNotificationClick(n: NotificationItemType) {
    if (n.unread) {
      markAsReadMutation.mutate(n.id)
    }
    const link = getNotificationLink(n)
    if (link) navigate(link)
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
  }

  return (
    <div className="min-h-screen bg-surface">
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
                onClick={handleMarkAllRead}
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
                onClick={() => { setActiveTab(tab.id); setPage(1) }}
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

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-on-surface-variant/60" />
            </div>
          ) : notifications.length === 0 ? (
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
              {grouped.map((group) => (
                <section key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={13} className="text-on-surface-variant/50" />
                    <h2 className="text-title-sm font-geist font-semibold text-on-surface-variant/70 uppercase tracking-wider">
                      {group.label}
                    </h2>
                    <div className="flex-1 h-px bg-outline-variant/20" />
                  </div>

                  <div className="space-y-0.5">
                    {group.items.map((n) => {
                      const style = TYPE_STYLES[n.type] ?? { icon: Bell, bg: "bg-surface-container-high", color: "text-on-surface-variant" }
                      const Icon = style.icon
                      const actionText = TYPE_LABELS[n.type] ?? "interacted with you"

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "group relative flex items-start gap-3 p-3 pl-8 rounded-lg transition-all duration-150 cursor-pointer",
                            n.unread
                              ? "bg-primary-container/5 hover:bg-primary-container/15"
                              : "hover:bg-surface-container/30"
                          )}
                        >
                          {n.unread && (
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}

                          <div className="shrink-0 mt-0.5">
                            {n.type === "SYSTEM" || !n.actor ? (
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", style.bg)}>
                                <Icon size={18} className={style.color} />
                              </div>
                            ) : (
                              <Avatar name={n.actor.name ?? n.actor.username} src={n.actor.avatar ?? undefined} size="sm" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-body-md text-on-surface font-inter leading-relaxed">
                              {n.type === "SYSTEM" ? (
                                <span className="text-on-surface-variant/80">
                                  {(n.metadata as any)?.message ?? "System notification"}
                                </span>
                              ) : (
                                <>
                                  {n.actor && (
                                    <span className="font-geist font-semibold">
                                      {n.actor.name ?? n.actor.username}{" "}
                                    </span>
                                  )}
                                  <span className="text-on-surface-variant/80">{actionText}</span>
                                </>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock size={11} className="text-on-surface-variant/40" />
                              <p className="text-body-sm text-on-surface-variant/60 font-inter">
                                {formatDistanceToNow(n.createdAt)}
                              </p>
                              {n.actor && (
                                <>
                                  <span className="text-on-surface-variant/20">·</span>
                                  <span className="text-body-sm text-on-surface-variant/40 font-inter">
                                    @{n.actor.username}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(n.id)
                            }}
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-on-surface-variant/30 hover:bg-surface-container hover:text-on-surface-variant/60 transition-all duration-150"
                          >
                            <Ellipsis size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              {page < totalPages && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full py-3 text-label-md text-on-surface-variant/50 font-geist font-medium hover:text-on-surface-variant transition-colors border-t border-outline-variant/10"
                >
                  Load older notifications
                </button>
              )}
            </div>
          )}
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4">
            <h3 className="font-geist font-semibold text-title-md text-on-surface mb-2">
              Notification Settings
            </h3>
            <p className="text-body-sm text-on-surface-variant font-inter leading-relaxed">
              Control which notifications you receive and how they're delivered.
            </p>
            <Link to="/settings">
              <button className="mt-3 text-label-sm text-primary font-geist font-medium hover:underline cursor-pointer">
                Manage preferences →
              </button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
