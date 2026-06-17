import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuiz, useMyAttempts, useAllAttempts, usePublishQuiz, useCloseQuiz, usePublishResults, useDeleteQuiz, useStartAttempt } from "../../../../../../../services/quizzes"
import { useCommunity, useCommunityGroup } from "../../../../../../../services/communities"
import { Button } from "../../../../../../../components/ui/Button"
import { Card } from "../../../../../../../components/ui/Card"
import { useState } from "react"
import {
  ArrowLeft, Play, Trash2, Lock, Eye, EyeOff, Clock, Users, ClipboardList,
  XCircle, AlertCircle,
} from "lucide-react"
import type { QuizAttempt } from "../../../../../../../services/quizzes"

export function QuizDetailPage() {
  const { id: communityId, groupId, quizId } = useParams<{ id: string; groupId: string; quizId: string }>()
  const navigate = useNavigate()
  const { data: community } = useCommunity(communityId!)
  const { data: group } = useCommunityGroup(communityId!, groupId!)
  const { data: quiz, isLoading } = useQuiz(communityId!, groupId!, quizId!)
  const { data: myAttempts } = useMyAttempts(communityId!, groupId!, quizId!)
  const { data: allAttempts } = useAllAttempts(communityId!, groupId!, quizId!)
  const publishQuiz = usePublishQuiz(communityId!, groupId!, quizId!)
  const closeQuiz = useCloseQuiz(communityId!, groupId!, quizId!)
  const publishResults = usePublishResults(communityId!, groupId!, quizId!)
  const deleteQuiz = useDeleteQuiz(communityId!, groupId!)
  const startAttempt = useStartAttempt(communityId!, groupId!, quizId!)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const canManage = group?.membership === "MODERATOR" || community?.membership === "ADMIN" || community?.membership === "OWNER"

  if (isLoading || !quiz) {
    return <div className="text-center py-12 text-on-surface-variant">Loading...</div>
  }

  const latestAttempt = myAttempts?.find((a) => a.status === "IN_PROGRESS")
  const completedAttempts = myAttempts?.filter((a) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED") ?? []
  const canTake = quiz.status === "PUBLISHED" && (quiz.maxAttempts === 0 || completedAttempts.length < quiz.maxAttempts)

  const handleStart = async () => {
    try {
      await startAttempt.mutateAsync()
      navigate(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/take`)
    } catch {
      // error handled by react query
    }
  }

  const handleDelete = async () => {
    await deleteQuiz.mutateAsync(quizId!)
    navigate(`/communities/${communityId}/groups/${groupId}/quizzes`)
  }

  let bestAttempt: QuizAttempt | null = null
  for (const a of completedAttempts) {
    if (!bestAttempt || (a.score ?? 0) > (bestAttempt.score ?? 0)) {
      bestAttempt = a
    }
  }

  return (
    <div>
      <Link
        to={`/communities/${communityId}/groups/${groupId}/quizzes`}
        className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Quizzes
      </Link>

      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-label-xs font-medium ${
                quiz.status === "DRAFT" ? "bg-warning/10 text-warning"
                : quiz.status === "PUBLISHED" ? "bg-success/10 text-success"
                : "bg-on-surface/10 text-on-surface-variant"
              }`}>
                {quiz.status}
              </span>
              {quiz.resultsPublished && (
                <span className="px-2 py-0.5 rounded-md text-label-xs font-medium bg-surface-container-high text-on-surface-variant">
                  <Eye size={10} className="inline mr-0.5" />
                  Results Published
                </span>
              )}
            </div>
            <h2 className="text-headline-sm font-geist font-bold text-on-surface">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-body-md text-on-surface-variant mt-1">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-label-sm text-on-surface-variant/60">
              <span className="flex items-center gap-1"><ClipboardList size={13} />{quiz._count.questions} questions</span>
              <span className="flex items-center gap-1"><Clock size={13} />{quiz.timeLimit} min</span>
              <span className="flex items-center gap-1"><Users size={13} />{quiz._count.attempts} attempts</span>
              <span className="flex items-center gap-1">
                {quiz.showResult === "IMMEDIATE" ? <Eye size={13} /> : <EyeOff size={13} />}
                {quiz.showResult === "IMMEDIATE" ? "Immediate results" : "Manual results"}
              </span>
              <span className="flex items-center gap-1">
                {quiz.maxAttempts === 0 ? "Unlimited attempts" : `${quiz.maxAttempts} attempt${quiz.maxAttempts > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 ml-4 flex-wrap justify-end">
            {canTake && !latestAttempt && (
              <Button
                icon={<Play size={14} />}
                onClick={handleStart}
                loading={startAttempt.isPending}
              >
                {quiz.maxAttempts > 0
                  ? `Take Quiz (${completedAttempts.length}/${quiz.maxAttempts})`
                  : "Take Quiz"}
              </Button>
            )}
            {latestAttempt && (
              <Button
                icon={<Play size={14} />}
                onClick={() => navigate(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/take`)}
              >
                Resume
              </Button>
            )}

            {canManage && quiz.status === "DRAFT" && (
              <>
                <Button
                  variant="outline"
                  icon={<Play size={14} />}
                  onClick={() => publishQuiz.mutate()}
                  loading={publishQuiz.isPending}
                >
                  Publish
                </Button>
                <Button
                  variant="ghost-danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              </>
            )}
            {canManage && quiz.status === "PUBLISHED" && (
              <Button
                variant="ghost"
                icon={<Lock size={14} />}
                onClick={() => closeQuiz.mutate()}
                loading={closeQuiz.isPending}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </Card>

      {completedAttempts.length > 0 && bestAttempt && (
        <Card className="p-4 mb-4">
          <h3 className="text-title-sm font-geist font-semibold text-on-surface mb-2">Your Results</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-headline-md font-geist font-bold text-primary">
                {bestAttempt.score ?? 0}
              </span>
              <span className="text-body-sm text-on-surface-variant">/ {bestAttempt.totalPoints}</span>
            </div>
            <span className="text-label-sm text-on-surface-variant/60">
              Best score · {completedAttempts.length} attempt{completedAttempts.length > 1 ? "s" : ""}
            </span>
            {(quiz.resultsPublished || quiz.showResult === "IMMEDIATE") && (
              <Link
                to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempt/${bestAttempt.id}`}
                className="text-label-sm text-primary hover:underline ml-auto"
              >
                View details
              </Link>
            )}
          </div>
        </Card>
      )}

      {canManage && allAttempts && allAttempts.length > 0 && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-title-sm font-geist font-semibold text-on-surface">
              All Attempts ({allAttempts.length})
            </h3>
            {quiz.showResult === "MANUAL" && !quiz.resultsPublished && allAttempts.some((a) => a.status !== "IN_PROGRESS") && (
              <Button
                size="sm"
                variant="outline"
                icon={<Eye size={14} />}
                onClick={() => publishResults.mutate()}
                loading={publishResults.isPending}
              >
                Publish Results
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {allAttempts.map((attempt: QuizAttempt & { user?: { id: string; name: string | null; username: string; avatar: string | null } }) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-label-sm font-geist font-medium text-on-surface-variant">
                    {attempt.user?.name?.charAt(0) ?? attempt.user?.username.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="text-body-sm font-geist font-medium text-on-surface">
                      {attempt.user?.name ?? attempt.user?.username ?? "Unknown"}
                    </p>
                    <p className="text-label-xs text-on-surface-variant/60">
                      {attempt.status === "IN_PROGRESS" ? "In progress" : `Score: ${attempt.score ?? "-"}/${attempt.totalPoints}`}
                    </p>
                  </div>
                </div>
                {(quiz.resultsPublished || quiz.showResult === "IMMEDIATE") && attempt.status !== "IN_PROGRESS" && (
                  <Link
                    to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempt/${attempt.id}`}
                    className="text-label-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {quiz.status === "PUBLISHED" && !latestAttempt && !completedAttempts.length && (
        <Card className="p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-on-surface-variant/30 mb-2" />
          <p className="text-title-sm font-geist text-on-surface-variant">Ready to test your knowledge?</p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1 mb-4">
            You have {quiz.maxAttempts === 0 ? "unlimited" : quiz.maxAttempts} attempt{quiz.maxAttempts > 1 ? "s" : ""}.
            {quiz.showResult === "MANUAL" ? " Your results will be hidden until published." : ""}
          </p>
          <Button icon={<Play size={14} />} onClick={handleStart} loading={startAttempt.isPending}>
            Start Quiz
          </Button>
        </Card>
      )}

      {completedAttempts.length >= quiz.maxAttempts && quiz.maxAttempts > 0 && (
        <Card className="p-8 text-center">
          <XCircle size={32} className="mx-auto text-on-surface-variant/30 mb-2" />
          <p className="text-title-sm font-geist text-on-surface-variant">All attempts used</p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1">
            You have used all {quiz.maxAttempts} attempt{quiz.maxAttempts > 1 ? "s" : ""} for this quiz.
          </p>
        </Card>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 w-full max-w-sm mx-4 p-6">
            <h3 className="text-title-md font-geist font-bold text-on-surface mb-2">Delete Quiz?</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              This will permanently delete "{quiz.title}" and all {quiz._count.attempts} attempts. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={handleDelete}
                loading={deleteQuiz.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
