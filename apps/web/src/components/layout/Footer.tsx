import { FlaskConical } from "lucide-react"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t border-outline-variant/15 bg-surface">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <FlaskConical size={20} className="text-primary" />
            <span className="font-geist font-bold text-title-md text-on-surface">
              Logos
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-label-sm text-on-surface-variant font-geist">
            <Link to="/" className="hover:text-on-surface transition-colors no-underline">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-on-surface transition-colors no-underline">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-on-surface transition-colors no-underline">
              Institutional Access
            </Link>
            <Link to="/" className="hover:text-on-surface transition-colors no-underline">
              API Documentation
            </Link>
            <Link to="/" className="hover:text-on-surface transition-colors no-underline">
              Contact Support
            </Link>
          </nav>
        </div>
        <div className="mt-6 text-center text-label-sm text-on-surface-variant/60 font-inter space-y-1">
          <p>&copy; {new Date().getFullYear()} Logos. Precision in Academic Discourse.</p>
          <p>
            Built by{" "}
            <a
              href="https://devazeem.cv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Azeem
            </a>{" "}
            &mdash;{" "}
            <a
              href="mailto:bljazeem@gmail.com"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              bljazeem@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
