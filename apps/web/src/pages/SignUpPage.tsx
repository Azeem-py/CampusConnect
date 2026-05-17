import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FlaskConical,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  GraduationCap,
  Users,
  Lightbulb,
  Sparkles,
  BookOpen,
  Brain,
  Camera,
  Image,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { useAuth } from "../contexts/AuthContext"

const DEPARTMENTS = [
  { value: "aeronautics", label: "Aeronautics & Astronautics" },
  { value: "anthropology", label: "Anthropology" },
  { value: "architecture", label: "Architecture" },
  { value: "biology", label: "Biology" },
  { value: "business", label: "Business & Management" },
  { value: "chemistry", label: "Chemistry" },
  { value: "civil-eng", label: "Civil Engineering" },
  { value: "communications", label: "Communications" },
  { value: "comp-sci", label: "Computer Science" },
  { value: "criminology", label: "Criminology" },
  { value: "data-science", label: "Data Science" },
  { value: "design", label: "Design" },
  { value: "economics", label: "Economics" },
  { value: "education", label: "Education" },
  { value: "electrical-eng", label: "Electrical Engineering" },
  { value: "english", label: "English Literature" },
  { value: "environmental", label: "Environmental Science" },
  { value: "film", label: "Film & Media Studies" },
  { value: "finance", label: "Finance" },
  { value: "history", label: "History" },
  { value: "international", label: "International Relations" },
  { value: "journalism", label: "Journalism" },
  { value: "law", label: "Law" },
  { value: "linguistics", label: "Linguistics" },
  { value: "mathematics", label: "Mathematics" },
  { value: "mechanical-eng", label: "Mechanical Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "music", label: "Music" },
  { value: "neuroscience", label: "Neuroscience" },
  { value: "nursing", label: "Nursing" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "philosophy", label: "Philosophy" },
  { value: "physics", label: "Physics" },
  { value: "political-sci", label: "Political Science" },
  { value: "psychology", label: "Psychology" },
  { value: "public-health", label: "Public Health" },
  { value: "sociology", label: "Sociology" },
  { value: "software-eng", label: "Software Engineering" },
  { value: "theology", label: "Theology & Religious Studies" },
  { value: "urban-planning", label: "Urban Planning" },
]

const UNIVERSITIES = [
  { value: "harvard", label: "Harvard University" },
  { value: "mit", label: "MIT" },
  { value: "stanford", label: "Stanford University" },
  { value: "oxford", label: "University of Oxford" },
  { value: "cambridge", label: "University of Cambridge" },
  { value: "caltech", label: "Caltech" },
  { value: "berkeley", label: "UC Berkeley" },
  { value: "eth-zurich", label: "ETH Zurich" },
  { value: "princeton", label: "Princeton University" },
  { value: "yale", label: "Yale University" },
  { value: "columbia", label: "Columbia University" },
  { value: "ucla", label: "UCLA" },
  { value: "imperial", label: "Imperial College London" },
  { value: "uchicago", label: "University of Chicago" },
  { value: "upenn", label: "University of Pennsylvania" },
  { value: "jhu", label: "Johns Hopkins University" },
  { value: "duke", label: "Duke University" },
  { value: "northwestern", label: "Northwestern University" },
  { value: "umich", label: "University of Michigan" },
  { value: "cornell", label: "Cornell University" },
  { value: "toronto", label: "University of Toronto" },
  { value: "national-singapore", label: "National University of Singapore" },
  { value: "tsinghua", label: "Tsinghua University" },
  { value: "ucl", label: "UCL" },
  { value: "nyu", label: "New York University" },
  { value: "carnegie-mellon", label: "Carnegie Mellon University" },
  { value: "usc", label: "University of Southern California" },
  { value: "uiuc", label: "University of Illinois Urbana-Champaign" },
  { value: "georgia-tech", label: "Georgia Tech" },
  { value: "purdue", label: "Purdue University" },
  { value: "washington", label: "University of Washington" },
  { value: "other", label: "Other Institution" },
]

const STEPS = [
  { id: 1, label: "Personal", icon: Users },
  { id: 2, label: "Academic", icon: GraduationCap },
  { id: 3, label: "Interests", icon: Lightbulb },
  { id: 4, label: "Profile", icon: Camera },
]

const FEATURES = [
  { icon: BookOpen, text: "Share research & insights with fellow academics" },
  { icon: Brain, text: "Write complex equations with native LaTeX" },
  { icon: Users, text: "Connect with students & faculty across departments" },
]

export function SignUpPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    school: "",
    interests: "",
    hobby: "",
    password: "",
    username: "",
    confirmPassword: "",
    avatar: "",
    banner: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.target.type === "file") return
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFileChange(name: string, file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, [name]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.name && !!form.username && !!form.email && !!form.password && !!form.confirmPassword && form.password === form.confirmPassword
    if (step === 2) return !!form.school && !!form.department
    if (step === 3) return true
    if (step === 4) return true
    return false
  }

  function nextStep() {
    if (step < 4) setStep((s) => s + 1)
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1)
  }

  const isLastStep = step === 4

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!isLastStep) {
      nextStep()
      return
    }

    setLoading(true)
    try {
      await signup(form)
      navigate("/feed")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isDone = step > s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? "bg-primary border-primary text-on-primary"
                      : isActive
                        ? "border-primary text-primary"
                        : "border-outline-variant text-on-surface-variant/40"
                  }`}
                >
                  {isDone ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                <span
                  className={`text-title-md font-geist font-medium hidden sm:inline transition-colors ${
                    isActive
                      ? "text-on-surface"
                      : isDone
                        ? "text-primary"
                        : "text-on-surface-variant/40"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 transition-colors duration-300 ${
                    isDone ? "bg-primary" : "bg-outline-variant/30"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderPersonalStep() {
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">About you</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Let's get the basics down first
          </p>
        </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full name"
              name="name"
              placeholder="e.g. Alex Rivera"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
            <Input
              label="Username"
              name="username"
              placeholder="@alex_rivera"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={form.phone}
            onChange={handleChange}
          />

        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@institution.edu"
          value={form.email}
          onChange={handleChange}
          required
        />

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-[40px] text-on-surface-variant hover:text-on-surface transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirm password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
      </div>
    )
  }

  function renderAcademicStep() {
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Your academic home</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Tell us where you study and what you're into
          </p>
        </div>

        <Select
          label="Institution"
          name="school"
          placeholder="Select your university"
          options={UNIVERSITIES}
          value={form.school}
          onChange={handleChange}
          required
          autoFocus
        />

        <Select
          label="Department"
          name="department"
          placeholder="Select your department"
          options={DEPARTMENTS}
          value={form.department}
          onChange={handleChange}
          required
        />
      </div>
    )
  }

  function renderInterestsStep() {
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Almost done</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Help us personalize your experience
          </p>
        </div>

        <Input
          label="What are you interested in?"
          name="interests"
          placeholder="e.g. Machine Learning, Quantum Physics, Poetry"
          value={form.interests}
          onChange={handleChange}
          autoFocus
        />

        <Input
          label="What's your hobby?"
          name="hobby"
          placeholder="e.g. Photography, Chess, Rock Climbing"
          value={form.hobby}
          onChange={handleChange}
        />
      </div>
    )
  }

  function renderProfileStep() {
    return (
      <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Profile picture</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Add a photo so your colleagues can recognise you
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          <label className="group relative w-28 h-28 rounded-full border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
            {form.avatar ? (
              <img src={form.avatar} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-surface-container-low">
                <Camera size={24} className="text-on-surface-variant/50 group-hover:text-primary/60 transition-colors" />
                <span className="text-label-sm text-on-surface-variant/50 font-geist font-medium group-hover:text-primary/60 transition-colors">
                  Upload
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("avatar", e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Banner image</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Give your profile a personal touch
          </p>
        </div>

        <label className="group relative w-full h-32 rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
          {form.banner ? (
            <img src={form.banner} alt="Banner preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-surface-container-low">
              <Image size={22} className="text-on-surface-variant/50 group-hover:text-primary/60 transition-colors" />
              <span className="text-label-sm text-on-surface-variant/50 font-geist font-medium group-hover:text-primary/60 transition-colors">
                Click to upload banner
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("banner", e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>

        <p className="text-body-sm text-on-surface-variant/50 font-inter text-center">
          You can always change these later
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15">
        <div className="mx-auto max-w-7xl flex items-center h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <FlaskConical size={22} className="text-primary" />
            <span className="font-geist font-bold text-title-lg text-on-surface">
              Scholarsphere
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-stretch">
        <div className="hidden lg:flex w-[440px] shrink-0 bg-gradient-to-br from-primary via-primary-container to-primary/80 text-on-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col justify-between p-10 w-full">
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical size={24} className="text-white/90" />
                <span className="font-geist font-bold text-title-lg text-white/90">Scholarsphere</span>
              </div>

              <div className="mt-12">
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-label-md font-geist font-medium text-white/90 mb-6">
                  <Sparkles size={14} />
                  Built for researchers, by researchers
                </div>

                <h2 className="font-geist font-bold text-display-lg text-white leading-tight">
                  Your campus.
                  <br />
                  <span className="text-white/80">Connected.</span>
                </h2>

                <p className="mt-4 text-body-lg text-white/70 font-inter leading-relaxed max-w-xs">
                  Join a network where ideas transcend departments and disciplines collide.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {FEATURES.map((feat) => {
                const Icon = feat.icon
                return (
                  <div key={feat.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <Icon size={15} className="text-white/90" />
                    </div>
                    <p className="text-body-md text-white/75 font-inter leading-snug">{feat.text}</p>
                  </div>
                )
              })}

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["AR", "ML", "SK", "JP"].map((init) => (
                      <div
                        key={init}
                        className="w-8 h-8 rounded-full bg-white/20 border-2 border-primary/60 flex items-center justify-center text-label-md font-geist font-bold text-white"
                      >
                        {init}
                      </div>
                    ))}
                  </div>
                  <p className="text-body-md text-white/60 font-inter">
                    <span className="text-white/90 font-medium">2,400+</span> scholars joined this month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <h1 className="font-geist font-bold text-headline-lg text-on-surface">
                Create your account
              </h1>
              <p className="mt-1 text-body-lg text-on-surface-variant font-inter">
                Join the academic community
              </p>
            </div>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6">
              {error && (
                <div className="mb-4 bg-error/10 border border-error/30 rounded-lg px-4 py-2.5 text-body-md text-error font-inter">
                  {error}
                </div>
              )}

              {step === 1 && renderPersonalStep()}
              {step === 2 && renderAcademicStep()}
              {step === 3 && renderInterestsStep()}
              {step === 4 && renderProfileStep()}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/10">
                <div>
                  {step > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={prevStep}>
                      Back
                    </Button>
                  ) : (
                    <Link
                      to="/login"
                      className="text-label-md text-on-surface-variant hover:text-on-surface font-geist font-medium no-underline transition-colors"
                    >
                      Already have an account?
                    </Link>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!canProceed()}
                  loading={loading && isLastStep}
                >
                  {isLastStep ? (
                    <>
                      Create Account
                      <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {step === 1 && (
              <p className="mt-5 text-center text-body-md text-on-surface-variant font-inter">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium no-underline transition-colors">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
