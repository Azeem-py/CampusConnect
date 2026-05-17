import { type InputHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-title-md text-on-surface-variant font-geist font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/60 font-inter text-body-md",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
