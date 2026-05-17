import { type ReactNode } from "react"
import { cn } from "../../lib/utils"

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4",
        hover && "hover:border-outline-variant/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  )
}
