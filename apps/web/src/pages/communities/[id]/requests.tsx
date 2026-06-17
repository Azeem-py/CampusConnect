import { useParams } from "react-router-dom"
import { Avatar } from "../../../components/ui/Avatar"
import { useJoinRequests, useHandleJoinRequest } from "../../../services/communities"
import { Check, X } from "lucide-react"

export function CommunityRequestsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: requests, isLoading } = useJoinRequests(id!)
  const handleRequest = useHandleJoinRequest(id!)

  if (isLoading) {
    return <div className="text-center py-12 text-on-surface-variant">Loading...</div>
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
        <p className="text-title-sm font-geist text-on-surface-variant">No pending requests</p>
        <p className="text-body-sm text-on-surface-variant/60 mt-1">Join requests from users will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-title-md font-geist font-semibold text-on-surface mb-4">Join Requests ({requests.length})</h2>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={req.user.avatar || undefined}
                name={req.user.name || req.user.username}
                size="sm"
              />
              <div>
                <p className="text-body-md font-medium text-on-surface">
                  {req.user.name || req.user.username}
                </p>
                <p className="text-label-sm text-on-surface-variant">@{req.user.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRequest.mutateAsync({ requestId: req.id, status: "APPROVED" })}
                disabled={handleRequest.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Check size={14} />
                Approve
              </button>
              <button
                onClick={() => handleRequest.mutateAsync({ requestId: req.id, status: "DECLINED" })}
                disabled={handleRequest.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-outline-variant/40 text-on-surface-variant rounded-lg text-label-sm font-geist font-medium hover:bg-error-container/10 hover:text-error disabled:opacity-50 transition-colors"
              >
                <X size={14} />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
