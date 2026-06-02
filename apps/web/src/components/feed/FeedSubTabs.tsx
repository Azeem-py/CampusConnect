import { cn } from "../../lib/utils"

interface SubTab {
  id: string
  label: string
}

interface FeedSubTabsProps {
  tabs: SubTab[]
  active: string
  onChange: (id: string) => void
}

export function FeedSubTabs({ tabs, active, onChange }: FeedSubTabsProps) {
  return (
    <div className="flex gap-2 pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 py-1 text-label-sm font-geist font-medium rounded-full transition-colors",
            active === tab.id
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-hover hover:text-on-surface"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
