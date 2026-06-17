import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useCreateQuiz } from "../../../../../../services/quizzes"
import type { QuestionType, ShowResult, CreateQuestionPayload } from "../../../../../../services/quizzes"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"

interface OptionForm {
  id: string
  text: string
  isCorrect: boolean
}

interface QuestionForm {
  id: string
  text: string
  type: QuestionType
  points: number
  options: OptionForm[]
}

let idCounter = 0
function uid() {
  return `f_${++idCounter}_${Date.now()}`
}

const emptyOption = (): OptionForm => ({ id: uid(), text: "", isCorrect: false })
const emptyQuestion = (): QuestionForm => ({
  id: uid(),
  text: "",
  type: "MCQ",
  points: 1,
  options: [emptyOption(), emptyOption()],
})

export function CreateQuizPage() {
  const { id: communityId, groupId } = useParams<{ id: string; groupId: string }>()
  const navigate = useNavigate()
  const createQuiz = useCreateQuiz(communityId!, groupId!)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [timeLimit, setTimeLimit] = useState(15)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [showResult, setShowResult] = useState<ShowResult>("MANUAL")
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()])
  const [error, setError] = useState<string | null>(null)

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, patch: Partial<QuestionForm>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, emptyOption()] } : q)),
    )
  }

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q,
      ),
    )
  }

  const updateOption = (questionId: string, optionId: string, patch: Partial<OptionForm>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o,
              ),
            }
          : q,
      ),
    )
  }

  const handleSubmit = async () => {
    setError(null)

    if (!title.trim()) {
      setError("Quiz title is required")
      return
    }

    const validQuestions: CreateQuestionPayload[] = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        setError(`Question ${i + 1} text is required`)
        return
      }

      const validOptions = q.options.filter((o) => o.text.trim())
      if (validOptions.length < 2) {
        setError(`Question ${i + 1} needs at least 2 options with text`)
        return
      }

      if (!validOptions.some((o) => o.isCorrect)) {
        setError(`Question ${i + 1} must have at least one correct answer`)
        return
      }

      validQuestions.push({
        text: q.text,
        type: q.type,
        points: q.points,
        order: i + 1,
        options: validOptions.map((o, oi) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: oi + 1,
        })),
      })
    }

    try {
      await createQuiz.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        timeLimit,
        maxAttempts,
        showResult,
        questions: validQuestions,
      })
      navigate(`/communities/${communityId}/groups/${groupId}/quizzes`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create quiz")
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

      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5 mb-4">
        <h2 className="text-title-lg font-geist font-bold text-on-surface mb-4">Create Quiz</h2>

        {error && (
          <div className="mb-4 p-3 bg-error-container/10 border border-error/20 rounded-lg text-body-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-title-md text-on-surface-variant font-geist font-medium mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MAT 201 - Chapter 3 Quiz"
              className="w-full h-11 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-title-md text-on-surface-variant font-geist font-medium mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Covers derivatives and integrals"
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-title-md text-on-surface-variant font-geist font-medium mb-1.5">
                Time Limit (min)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value)))}
                min={1}
                max={180}
                className="w-full h-11 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-title-md text-on-surface-variant font-geist font-medium mb-1.5">
                Max Attempts
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full h-11 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value={1}>Once</option>
                <option value={0}>Unlimited</option>
                <option value={2}>2 times</option>
                <option value={3}>3 times</option>
              </select>
            </div>
            <div>
              <label className="block text-title-md text-on-surface-variant font-geist font-medium mb-1.5">
                Result Visibility
              </label>
              <select
                value={showResult}
                onChange={(e) => setShowResult(e.target.value as ShowResult)}
                className="w-full h-11 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="MANUAL">Manual (I publish)</option>
                <option value="IMMEDIATE">Immediate (show after submit)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title-md font-geist font-semibold text-on-surface">
            Questions ({questions.length})
          </h3>
          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-geist font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Add Question
          </button>
        </div>

        {questions.map((question, qi) => (
          <div
            key={question.id}
            className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-on-surface-variant/30 cursor-grab" />
                <span className="text-label-md font-geist font-semibold text-on-surface-variant">
                  Q{qi + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={question.type}
                  onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                  className="h-8 px-2 bg-surface-container border border-outline-variant/20 rounded-lg text-label-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                </select>
                <div className="flex items-center gap-1">
                  <label className="text-label-xs text-on-surface-variant">pts:</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, { points: Math.max(1, Number(e.target.value)) })}
                    min={1}
                    max={100}
                    className="w-14 h-8 px-2 bg-surface-container border border-outline-variant/20 rounded-lg text-label-sm text-on-surface focus:outline-none focus:border-primary transition-colors text-center"
                  />
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-1.5 text-on-surface-variant/50 hover:text-error transition-colors rounded-lg hover:bg-error-container/10"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
              placeholder="Enter your question..."
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors mb-3"
            />

            <div className="space-y-2">
              <label className="text-label-xs text-on-surface-variant font-medium">Options</label>
              {question.options.map((option, oi) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type={question.type === "TRUE_FALSE" ? "radio" : "radio"}
                    name={`correct_${question.id}`}
                    checked={option.isCorrect}
                    onChange={() =>
                      updateQuestion(question.id, {
                        options: question.options.map((o) => ({ ...o, isCorrect: o.id === option.id })),
                      })
                    }
                    className="accent-primary"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(question.id, option.id, { text: e.target.value })}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 h-9 px-3 bg-surface-container border border-outline-variant/20 rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                  />
                  {question.options.length > 2 && question.type !== "TRUE_FALSE" && (
                    <button
                      onClick={() => removeOption(question.id, option.id)}
                      className="p-1 text-on-surface-variant/40 hover:text-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <span className="text-label-xs text-on-surface-variant/40 w-4 text-right">
                    {option.isCorrect ? "✓" : ""}
                  </span>
                </div>
              ))}
              {question.type !== "TRUE_FALSE" && (
                <button
                  onClick={() => addOption(question.id)}
                  className="text-label-sm text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  + Add option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={createQuiz.isPending}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-geist font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createQuiz.isPending ? "Creating..." : "Create Quiz"}
        </button>
        <Link
          to={`/communities/${communityId}/groups/${groupId}/quizzes`}
          className="px-6 py-2.5 bg-surface-container text-on-surface rounded-lg text-label-md font-geist font-medium hover:bg-surface-container-high transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
