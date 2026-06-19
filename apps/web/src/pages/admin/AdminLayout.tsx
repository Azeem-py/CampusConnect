import { Navigate, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { Sidebar } from "../../components/layout/Sidebar"
import { cn } from "../../lib/utils"
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Building2,
  FileText,
  Ban,
  BarChart3,
} from "lucide-react"

const adminTabs = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/reports", icon: ShieldAlert, label: "Reports" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/institutions", icon: Building2, label: "Schools" },
  { to: "/admin/content", icon: FileText, label: "Content" },
  { to: "/admin/banned-words", icon: Ban, label: "Banned Words" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
]

export function AdminLayout() {
  const { user: currentUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser || currentUser.role !== "ADMIN") {
    return <Navigate to="/feed" replace />
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />
        <main className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="font-geist font-bold text-display-md text-on-surface">
              Admin Dashboard
            </h1>
            <p className="text-body-md text-on-surface-variant font-inter mt-1">
              Manage users, content, institutions, and platform settings.
            </p>
          </div>

          {/* Tabs navigation */}
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 gap-1">
            {adminTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-geist font-medium border-b-2 transition-colors -mb-px",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-gray-300 dark:hover:border-gray-600"
                  )
                }
              >
                <tab.icon size={16} />
                {tab.label}
              </NavLink>
            ))}
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  )
}
