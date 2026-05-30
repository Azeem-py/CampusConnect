import { Home, Compass, Bell, User, Plus } from "lucide-react"
import { NavLink, Link } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { useAuth } from "../../contexts/AuthContext"

const navItems = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
]

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-2 py-4">
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
        {navItems.map((item) => (
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
            {item.label}
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
