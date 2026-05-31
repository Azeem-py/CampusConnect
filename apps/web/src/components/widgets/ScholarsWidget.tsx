import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { useSuggestedScholars, useFollowUser } from "../../services/auth"
import { useQueryClient } from "@tanstack/react-query"

export function ScholarsWidget() {
  const queryClient = useQueryClient()
  const { data: scholars = [], isLoading } = useSuggestedScholars()
  const followMutation = useFollowUser()

  const handleFollow = (scholarId: string) => {
    followMutation.mutate(scholarId, {
      onSuccess: () => {
        // Invalidate suggested scholars to fetch new recommendations
        queryClient.invalidateQueries({ queryKey: ["suggestedScholars"] })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-outline-variant/20 rounded w-1/2 mb-3" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 w-full">
                <div className="w-8 h-8 rounded-full bg-outline-variant/20 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3.5 bg-outline-variant/20 rounded w-3/4" />
                  <div className="h-2.5 bg-outline-variant/20 rounded w-1/2" />
                </div>
              </div>
              <div className="w-16 h-8 bg-outline-variant/20 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (scholars.length === 0) {
    return null
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 animate-fade-in">
      <h3 className="text-title-md font-geist font-semibold text-on-surface mb-3">
        Suggested Scholars
      </h3>
      <div className="space-y-3">
        {scholars.map((scholar) => (
          <div
            key={scholar.id}
            className="flex items-center justify-between gap-2 transition-all duration-300 hover:translate-x-0.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={scholar.name} src={scholar.avatar} size="sm" />
              <div className="min-w-0">
                <p className="text-title-sm font-geist font-medium text-on-surface truncate">
                  {scholar.name}
                </p>
                <p className="text-body-sm text-on-surface-variant font-inter truncate">
                  @{scholar.username} • {scholar.title}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 font-geist"
              onClick={() => handleFollow(scholar.id)}
              disabled={followMutation.isPending}
            >
              Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
