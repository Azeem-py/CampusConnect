import { Home, Compass, Bell, User, Plus, Settings, Users, LayoutDashboard } from "lucide-react"
import { NavLink, Link } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { useAuth } from "../../contexts/AuthContext"
import { useNotificationContext } from "../../contexts/NotificationContext"

const navItems = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/communities", icon: Users, label: "Communities" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const { user } = useAuth()
  const { unreadCount } = useNotificationContext()

  const items = [...navItems]
  if (user?.role === "ADMIN") {
    items.push({ to: "/admin", icon: LayoutDashboard, label: "Admin" })
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-2 py-4 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-3 px-4 mb-2">
        <Avatar src={user?.avatar ?? undefined} name={user?.name ?? "User"} size="md" />
        <div>
          <p className="text-title-md font-geist font-semibold text-on-surface leading-tight">
            {user?.name}
          </p>
          <p className="text-body-sm text-on-surface-variant font-inter">
            @{user?.username}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-title-sm font-geist font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.label === "Alerts" && unreadCount > 0 && (
              <span className="bg-primary text-on-primary text-label-xs font-geist font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 mt-2">
        <Link to="/create">
          <Button variant="primary" size="md" className="w-full" icon={<Plus size={16} />}>
            Post
          </Button>
        </Link>
      </div>
    </aside>
  )
}
