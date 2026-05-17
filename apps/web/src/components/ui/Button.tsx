import { type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "../../lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "ghost-danger"
  size?: "sm" | "md" | "lg"
  icon?: ReactNode
  loading?: boolean
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  iconOnly,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-geist font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  const variants = {
    primary:
      "bg-primary text-on-primary hover:brightness-110 active:brightness-95",
    secondary:
      "bg-surface-container-high text-on-surface border border-outline-variant/20 hover:bg-surface-container-highest",
    ghost:
      "bg-transparent text-primary hover:bg-primary/5",
    danger:
      "bg-error text-on-error hover:brightness-110 active:brightness-95",
    outline:
      "bg-transparent text-primary border border-primary hover:bg-primary/5",
    "ghost-danger":
      "bg-transparent text-error hover:bg-error/5",
  }

  const sizes = {
    sm: "h-8 px-3 text-label-md rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-lg",
    lg: "h-12 px-6 text-base rounded-lg",
  }

  const iconOnlySizes = {
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0",
  }

  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        base,
        variants[variant],
        iconOnly ? iconOnlySizes[size] : sizes[size],
        loading && "relative cursor-wait",
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className={cn(
            "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
            !children && icon && "absolute"
          )}
        />
      ) : icon ? (
        <span className={cn("shrink-0", iconOnly && "flex items-center justify-center")}>
          {icon}
        </span>
      ) : null}
      {!iconOnly && children}
    </button>
  )
}
