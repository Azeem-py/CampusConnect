import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuiz, useStartAttempt, useSubmitAttempt, useMyAttempts } from "../../../../../../../services/quizzes"
import { useCommunityGroup } from "../../../../../../../services/communities"
import { useState, useEffect, useRef, useCallback } from "react"
import type { QuizQuestion, QuizAttempt } from "../../../../../../../services/quizzes"
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Flag } from "lucide-react"

export function TakeQuizPage() {
  const { id: communityId, groupId, quizId } = useParams<{ id: string; groupId: string; quizId: string }>()
  const navigate = useNavigate()
  const { data: group } = useCommunityGroup(communityId!, groupId!)
  const { data: quiz } = useQuiz(communityId!, groupId!, quizId!)
  const startAttempt = useStartAttempt(communityId!, groupId!, quizId!)
  const submitAttempt = useSubmitAttempt(communityId!, groupId!, quizId!)
  const { refetch: refetchMyAttempts } = useMyAttempts(communityId!, groupId!, quizId!)

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submitLock = useRef(false)

  const initAttempt = useCallback(async () => {
    try {
      setError(null)
      const result = await startAttempt.mutateAsync()
      setAttempt(result.attempt)
      setQuestions(result.questions)
      setRemainingSeconds(result.remainingSeconds)
      setAnswers({})
      setCurrentQ(0)
      setInitialized(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start attempt")
    }
  }, [startAttempt])

  useEffect(() => {
    if (!initialized && !startAttempt.isPending && !attempt) {
      initAttempt()
    }
  }, [initialized, startAttempt.isPending, attempt, initAttempt])

  useEffect(() => {
    if (remainingSeconds <= 0 || !attempt) return

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [remainingSeconds, attempt?.id])

  const handleSubmit = useCallback(async (_isAuto = false) => {
    if (submitLock.current) return
    submitLock.current = true

    if (timerRef.current) clearInterval(timerRef.current)

    setSubmitting(true)
    setShowConfirm(false)

    const answerList = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId,
    }))

    if (answerList.length === 0) {
      setError("You must answer at least one question before submitting")
      submitLock.current = false
      setSubmitting(false)
      return
    }

    if (!attempt) return

    try {
      const result = await submitAttempt.mutateAsync({
        attemptId: attempt.id,
        answers: answerList,
      })

      await refetchMyAttempts()
      navigate(
        `/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempt/${result.id}`,
        { replace: true },
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit attempt")
      submitLock.current = false
      setSubmitting(false)
    }
  }, [answers, submitAttempt, communityId, groupId, quizId, navigate, refetchMyAttempts, attempt])

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-8 max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-error mb-3" />
          <h2 className="text-title-lg font-geist font-bold text-on-surface mb-2">Cannot Start Quiz</h2>
          <p className="text-body-md text-on-surface-variant mb-4">{error}</p>
          <Link
            to={`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`}
            className="inline-flex px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    )
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const answeredCount = Object.keys(answers).length
  const isLowTime = remainingSeconds <= 30

  const question = questions[currentQ]
  const selected = answers[question.id] ?? ""

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className={`sticky top-0 z-10 ${isLowTime ? "bg-error-container/10" : "bg-surface-container-lowest"} border-b border-outline-variant/15 transition-colors`}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-title-sm font-geist font-semibold text-on-surface">{quiz?.title}</span>
              <span className="text-label-sm text-on-surface-variant/60">{group?.name}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-geist font-bold tabular-nums ${
              isLowTime ? "bg-error/10 text-error animate-pulse" : "bg-surface-container text-on-surface"
            }`}>
              <Clock size={16} />
              {formatTime(remainingSeconds)}
            </div>
          </div>

          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                isLowTime ? "bg-error" : "bg-primary"
              }`}
              style={{ width: `${((remainingSeconds / (quiz?.timeLimit ?? 1) / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-label-sm font-geist font-medium text-on-surface-variant">
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="px-2 py-0.5 bg-surface-container-high rounded-md text-label-xs text-on-surface-variant">
              {question.points} pt{question.points > 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-label-sm text-on-surface-variant/60">
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6 mb-6">
          <h2 className="text-title-lg font-geist font-semibold text-on-surface mb-5">
            {question.text}
          </h2>

          {question.type === "TRUE_FALSE" ? (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt: QuizQuestion["options"][number]) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`h-14 rounded-xl text-body-md font-geist font-medium transition-all duration-150 ${
                    selected === opt.id
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {question.options.map((opt: QuizQuestion["options"][number], oi: number) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left p-4 rounded-xl text-body-md transition-all duration-150 flex items-center gap-3 ${
                    selected === opt.id
                      ? "bg-primary/10 border border-primary/30 text-on-surface"
                      : "bg-surface-container border border-outline-variant/15 text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-geist font-medium shrink-0 ${
                    selected === opt.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl text-label-md font-geist font-medium hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-geist font-medium hover:bg-primary/90 transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-success text-white rounded-xl text-label-md font-geist font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Flag size={16} />
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/15 py-3">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {questions.map((q, qi) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = qi === currentQ
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(qi)}
                  className={`w-8 h-8 rounded-lg text-label-xs font-geist font-medium transition-all ${
                    isCurrent
                      ? "ring-2 ring-primary"
                      : isAnswered
                        ? "bg-primary/15 text-primary"
                        : "bg-surface-container text-on-surface-variant/60 hover:bg-surface-container-high"
                  }`}
                >
                  {qi + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 w-full max-w-sm mx-4 p-6">
            <h3 className="text-title-md font-geist font-bold text-on-surface mb-2">Submit Quiz?</h3>
            <p className="text-body-sm text-on-surface-variant mb-1">
              You answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-body-sm text-warning mb-3 flex items-center gap-1">
                <AlertCircle size={14} />
                {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} not answered.
              </p>
            )}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-surface-container text-on-surface rounded-lg text-label-sm font-geist font-medium hover:bg-surface-container-high transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-4 py-2 bg-success text-white rounded-lg text-label-sm font-geist font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
