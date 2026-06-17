import { useParams, Link } from "react-router-dom"
import { useAttemptResult, useQuiz } from "../../../../../../../../services/quizzes"
import { useCommunityGroup } from "../../../../../../../../services/communities"
import { ArrowLeft, CheckCircle2, XCircle, EyeOff, Clock } from "lucide-react"

export function AttemptResultPage() {
  const { id: communityId, groupId, quizId, attemptId } = useParams<{
    id: string
    groupId: string
    quizId: string
    attemptId: string
  }>()
  const { data: group } = useCommunityGroup(communityId!, groupId!)
  const { data: quiz } = useQuiz(communityId!, groupId!, quizId!)
  const { data: result, isLoading } = useAttemptResult(communityId!, groupId!, quizId!, attemptId!)

  if (isLoading || !result) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { attempt, visible } = result

  if (!visible) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-8 max-w-md text-center">
          <EyeOff size={40} className="mx-auto text-on-surface-variant/40 mb-3" />
          <h2 className="text-title-lg font-geist font-bold text-on-surface mb-2">Results Hidden</h2>
          <p className="text-body-md text-on-surface-variant mb-4">
            {result.message ?? "The quiz creator has not published results yet."}
          </p>
          <Link
            to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`}
            className="inline-flex px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Quiz
          </Link>
        </div>
      </div>
    )
  }

  const score = attempt.score ?? 0
  const totalPoints = attempt.totalPoints
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

  const gradeColor =
    percentage >= 80 ? "text-success"
    : percentage >= 60 ? "text-warning"
    : "text-error"

  const timeTaken = attempt.submittedAt
    ? Math.round(
        (new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000,
      )
    : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div>
      <Link
        to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`}
        className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Quiz
      </Link>

      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6 mb-4 text-center">
        <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-1">
          {quiz?.title ?? "Quiz Results"}
        </h2>
        <p className="text-body-sm text-on-surface-variant/60 mb-6">{group?.name}</p>

        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-outline-variant/20 mb-3">
          <span className={`text-headline-xl font-geist font-bold ${gradeColor}`}>
            {percentage}%
          </span>
        </div>

        <div className="text-title-lg font-geist font-semibold text-on-surface">
          {score} / {totalPoints}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-label-sm text-on-surface-variant/60">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {formatTime(timeTaken)}
          </span>
          <span>
            {attempt.status === "AUTO_SUBMITTED" ? "Auto-submitted" : "Submitted"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-title-sm font-geist font-semibold text-on-surface">Questions</h3>
        {attempt.answers?.map((answer: { id: string; isCorrect: boolean | null; pointsEarned: number | null; questionId: string; selectedOptionId: string | null; question?: { id: string; text: string; type: string; points: number; order: number } | null; selectedOption?: { id: string; text: string; order: number; isCorrect?: boolean } | null }, ai: number) => {
          const q = answer.question
          if (!q) return null

          const isCorrect = answer.isCorrect

          return (
            <div
              key={answer.id}
              className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-geist font-semibold text-on-surface-variant">Q{ai + 1}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded-md text-label-xs text-on-surface-variant">
                    {q.points} pt{q.points > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isCorrect !== null && (
                    <span className={`flex items-center gap-1 text-label-sm font-medium ${
                      isCorrect ? "text-success" : "text-error"
                    }`}>
                      {isCorrect ? (
                        <><CheckCircle2 size={14} /> +{answer.pointsEarned}</>
                      ) : (
                        <><XCircle size={14} /> 0</>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-body-md font-geist font-medium text-on-surface mb-3">{q.text}</p>

              <div className="space-y-1.5">
                {answer.selectedOption ? (
                  <div className={`p-2.5 rounded-lg text-body-sm flex items-center gap-2 ${
                    answer.selectedOption.isCorrect
                      ? "bg-success/10 border border-success/20 text-on-surface"
                      : "bg-error/10 border border-error/20 text-on-surface"
                  }`}>
                    {answer.selectedOption.isCorrect ? (
                      <CheckCircle2 size={14} className="text-success shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-error shrink-0" />
                    )}
                    <span>Your answer: {answer.selectedOption.text}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-surface-container text-body-sm text-on-surface-variant">
                    No answer
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <Link
          to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`}
          className="inline-flex px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Quiz
        </Link>
      </div>
    </div>
  )
}
