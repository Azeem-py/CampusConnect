import { Search, FlaskConical } from "lucide-react"
import { Button } from "../ui/Button"
import { Link, useLocation } from "react-router-dom"
import { BottomNav } from "./BottomNav"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLanding = location.pathname === "/"
  const hideShell = isLanding || location.pathname === "/create" || location.pathname === "/login" || location.pathname === "/signup"

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <FlaskConical size={22} className="text-primary" />
          <span className="font-geist font-bold text-title-lg text-on-surface hidden sm:inline">
            Scholarsphere
          </span>
          </Link>

          <div className="relative max-w-md w-full mx-4 hidden md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 bg-surface-container border border-outline-variant/20 rounded text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-label-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors">
              <Button variant="ghost" size="sm">Switch to Landing</Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
      <BottomNav />
    </>
  )
}
