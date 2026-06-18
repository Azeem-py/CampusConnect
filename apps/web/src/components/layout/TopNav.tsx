import { Search, FlaskConical } from "lucide-react"
import { Button } from "../ui/Button"
import { Link } from "react-router-dom"

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15">
      <div className="mx-auto max-w-7xl flex items-center justify-between h-14 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
          <FlaskConical size={22} className="text-primary" />
          <span className="font-geist font-bold text-title-lg text-on-surface hidden sm:inline">
            Logos
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">
            Research
          </Link>
          <Link to="/explore" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">
            Departments
          </Link>
          <Link to="/" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">
            Events
          </Link>
          <Link to="/" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">
            Publications
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-48 lg:w-56 pl-9 pr-3 bg-surface-container border border-outline-variant/20 rounded text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <Button variant="primary" size="sm">
            Join Scholar
          </Button>
        </div>
      </div>
    </header>
  )
}
