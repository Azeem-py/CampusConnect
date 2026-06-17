import { Home, Compass, PlusCircle, Bell, User } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"
import { useNotificationContext } from "../../contexts/NotificationContext"

const items = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/create", icon: PlusCircle, label: "Post" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const { unreadCount } = useNotificationContext()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-t border-outline-variant/15 lg:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-0.5 py-1 px-3 transition-colors",
                isActive ? "text-primary" : "text-on-surface-variant"
              )
            }
          >
            <span className="relative">
              <item.icon size={18} />
              {item.label === "Alerts" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] font-geist font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="font-geist text-label-sm font-medium leading-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
