import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuizzes, useDeleteQuiz } from "../../../../../../services/quizzes"
import { useCommunity, useCommunityGroup } from "../../../../../../services/communities"
import { Button } from "../../../../../../components/ui/Button"
import { Card } from "../../../../../../components/ui/Card"
import { Plus, ClipboardList, Eye, EyeOff, Trash2, Clock, Users } from "lucide-react"

const statusColors: Record<string, string> = {
  DRAFT: "bg-warning/10 text-warning",
  PUBLISHED: "bg-success/10 text-success",
  CLOSED: "bg-on-surface/10 text-on-surface-variant",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
}

export function QuizzesPage() {
  const { id: communityId, groupId } = useParams<{ id: string; groupId: string }>()
  const navigate = useNavigate()
  const { data: community } = useCommunity(communityId!)
  const { data: group } = useCommunityGroup(communityId!, groupId!)
  const { data: quizzes, isLoading } = useQuizzes(communityId!, groupId!)
  const deleteQuiz = useDeleteQuiz(communityId!, groupId!)

  const canManage = group?.membership === "MODERATOR" || community?.membership === "ADMIN" || community?.membership === "OWNER"

  if (isLoading || !quizzes) {
    return <div className="text-center py-12 text-on-surface-variant">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-title-lg font-geist font-bold text-on-surface">Quizzes</h2>
          <p className="text-body-sm text-on-surface-variant/60">{group?.name}</p>
        </div>
        {canManage && (
          <Link
            to={`/communities/${communityId}/groups/${groupId}/quizzes/create`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Create Quiz
          </Link>
        )}
      </div>

      {quizzes.length === 0 ? (
        <Card className="text-center py-16">
          <ClipboardList size={36} className="mx-auto text-on-surface-variant/40 mb-3" />
          <p className="text-title-sm font-geist text-on-surface-variant">No quizzes yet</p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1">
            {canManage ? "Create your first quiz for this group." : "No quizzes available yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz: { id: string; title: string; description: string | null; status: string; showResult: string; resultsPublished: boolean; timeLimit: number; _count: { questions: number; attempts: number } }) => {
            const latestAttempt = quiz._count.attempts
            return (
              <Card key={quiz.id} hover className="p-4">
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/communities/${communityId}/groups/${groupId}/quizzes/${quiz.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-label-xs font-medium ${statusColors[quiz.status]}`}>
                        {statusLabels[quiz.status]}
                      </span>
                      {quiz.showResult === "MANUAL" && !quiz.resultsPublished && (
                        <span className="px-2 py-0.5 rounded-md text-label-xs font-medium bg-surface-container-high text-on-surface-variant">
                          <EyeOff size={10} className="inline mr-0.5" />
                          Hidden
                        </span>
                      )}
                      {quiz.resultsPublished && (
                        <span className="px-2 py-0.5 rounded-md text-label-xs font-medium bg-surface-container-high text-on-surface-variant">
                          <Eye size={10} className="inline mr-0.5" />
                          Results out
                        </span>
                      )}
                    </div>
                    <h3 className="text-title-md font-geist font-semibold text-on-surface truncate">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-body-sm text-on-surface-variant/70 mt-0.5 line-clamp-1">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-label-sm text-on-surface-variant/50">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={12} />
                        {quiz._count.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {quiz.timeLimit} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {latestAttempt} {latestAttempt === 1 ? "attempt" : "attempts"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    {canManage && quiz.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 size={14} />}
                        onClick={() => {
                          if (window.confirm(`Delete "${quiz.title}"?`)) {
                            deleteQuiz.mutate(quiz.id)
                          }
                        }}
                        disabled={deleteQuiz.isPending}
                      />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
