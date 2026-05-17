import { Home, Compass, PlusCircle, Bell, User } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"

const items = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/create", icon: PlusCircle, label: "Post" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-t border-outline-variant/15 lg:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 transition-colors",
                isActive ? "text-primary" : "text-on-surface-variant"
              )
            }
          >
            <item.icon size={18} />
            <span className="font-geist text-label-sm font-medium leading-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
