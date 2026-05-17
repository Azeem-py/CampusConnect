import { cn } from "../../lib/utils"

interface AvatarProps {
  src?: string
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-geist font-semibold",
        sizeMap[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
