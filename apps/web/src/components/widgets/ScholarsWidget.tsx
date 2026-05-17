import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"

interface Scholar {
  name: string
  handle?: string
  title: string
  avatar?: string
}

const scholars: Scholar[] = [
  { name: "Dr. Elena Rostova", title: "Cognitive Science" },
  { name: "Prof. Marcus Klein", title: "Macroeconomics", handle: "MK" },
]

export function ScholarsWidget() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4">
      <h3 className="text-title-md font-geist font-semibold text-on-surface mb-3">
        Suggested Scholars
      </h3>
      <div className="space-y-3">
        {scholars.map((scholar) => (
          <div
            key={scholar.name}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={scholar.name} src={scholar.avatar} size="sm" />
              <div className="min-w-0">
                <p className="text-title-sm font-geist font-medium text-on-surface truncate">
                  {scholar.name}
                </p>
                <p className="text-body-sm text-on-surface-variant font-inter truncate">
                  {scholar.title}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0">
              Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
