import { type ReactNode } from "react"
import { cn } from "../../lib/utils"

interface TagProps {
  children: ReactNode
  variant?: "department" | "trending" | "skill"
  className?: string
}

export function Tag({ children, variant = "department", className }: TagProps) {
  const variants = {
    department:
      "bg-primary/10 text-primary-container font-geist font-semibold text-label-sm tracking-wide rounded-full",
    trending:
      "bg-surface-container text-on-surface-variant font-inter text-body-md rounded",
    skill:
      "bg-surface-variant text-on-surface-variant font-geist text-label-sm rounded-full",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
