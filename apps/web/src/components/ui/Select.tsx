import { type SelectHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-title-md text-on-surface-variant font-geist font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "h-11 w-full appearance-none px-3 pr-10 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-inter text-body-md",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
              !props.value && "text-on-surface-variant/60",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-on-surface bg-surface-container-lowest">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        </div>
      </div>
    )
  }
)
