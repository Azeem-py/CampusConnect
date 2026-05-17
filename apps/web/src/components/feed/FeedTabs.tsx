import { cn } from "../../lib/utils"

interface Tab {
  id: string
  label: string
}

interface FeedTabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function FeedTabs({ tabs, active, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-6 border-b border-outline-variant/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative pb-2 text-title-sm font-geist font-medium transition-colors",
            active === tab.id
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
