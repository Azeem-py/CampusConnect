import type { CommunityGroup } from "../../../../services/communities"
import { Calendar, Users } from "lucide-react"
import { formatDistanceToNow } from "../../../../lib/utils"

interface GroupInfoTabProps {
  group: CommunityGroup
}

export function GroupInfoTab({ group }: GroupInfoTabProps) {
  return (
    <div className="space-y-4">
      {group.description && (
        <div>
          <h4 className="text-label-sm font-geist font-medium text-on-surface-variant mb-1">About</h4>
          <p className="text-body-md text-on-surface leading-relaxed">{group.description}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-label-sm text-on-surface-variant/60">
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          {group._count.members} {group._count.members === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          Created {formatDistanceToNow(group.createdAt)} ago
        </span>
      </div>
    </div>
  )
}
