import { Link } from "react-router-dom"
import { Avatar } from "../../../../components/ui/Avatar"
import { Users } from "lucide-react"
import type { CommunityGroup } from "../../../../services/communities"

interface GroupCardProps {
  group: CommunityGroup
  communityId: string
}

export function GroupCard({ group, communityId }: GroupCardProps) {
  return (
    <Link
      to={`/communities/${communityId}/groups/${group.id}`}
      className="flex flex-col items-center gap-2 p-5 bg-surface-container-lowest border border-outline-variant/15 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
    >
      <Avatar
        src={group.avatar || undefined}
        name={group.name}
        size="xl"
        className="ring-2 ring-outline-variant/10"
      />
      <div className="text-center min-w-0 w-full">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-title-sm font-geist font-semibold text-on-surface truncate">{group.name}</h3>
          {group.membership && (
            <span className="text-label-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize shrink-0">
              {group.membership.toLowerCase()}
            </span>
          )}
        </div>
        {group.description && (
          <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-1">{group.description}</p>
        )}
        <div className="flex items-center justify-center gap-1 mt-2 text-label-sm text-on-surface-variant/60">
          <Users size={12} />
          <span>{group._count.members} {group._count.members === 1 ? "member" : "members"}</span>
        </div>
      </div>
    </Link>
  )
}
