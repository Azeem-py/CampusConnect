import { useState, useRef } from "react"
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
  Trash2,
  Upload,
  Plus,
  X,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { useAuth } from "../contexts/AuthContext"
import { uploadPublicFile } from "../services/storage"

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

const PRESET_INTERESTS = [
  "Machine Learning",
  "Quantum Physics",
  "Cybersecurity",
  "Creative Writing",
  "Biotechnology",
  "Astrophysics",
  "Game Development",
  "Macroeconomics",
  "Sustainable Energy",
  "Organic Chemistry",
  "Data Science",
  "Robotics",
  "Ancient History",
  "Philosophy",
  "Cognitive Science",
]

const PRESET_HOBBIES = [
  "Photography",
  "Chess",
  "Rock Climbing",
  "Cooking",
  "Hiking",
  "Painting",
  "Playing Guitar",
  "Gardening",
  "Cycling",
  "Video Games",
  "Running",
  "Yoga",
  "Reading",
  "Sketching",
  "Table Tennis",
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
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isAvatarDragging, setIsAvatarDragging] = useState(false)
  const [isBannerDragging, setIsBannerDragging] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [customInterestInput, setCustomInterestInput] = useState("")
  const [customHobbyInput, setCustomHobbyInput] = useState("")
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

  function addInterest(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return
    const current = form.interests
      ? form.interests.split(",").map((i) => i.trim()).filter(Boolean)
      : []
    if (current.includes(trimmed)) return
    setForm((prev) => ({
      ...prev,
      interests: [...current, trimmed].join(", "),
    }))
  }

  function removeInterest(tag: string) {
    const current = form.interests
      ? form.interests.split(",").map((i) => i.trim()).filter(Boolean)
      : []
    setForm((prev) => ({
      ...prev,
      interests: current.filter((i) => i !== tag).join(", "),
    }))
  }

  function addHobby(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return
    const current = form.hobby
      ? form.hobby.split(",").map((h) => h.trim()).filter(Boolean)
      : []
    if (current.includes(trimmed)) return
    setForm((prev) => ({
      ...prev,
      hobby: [...current, trimmed].join(", "),
    }))
  }

  function removeHobby(tag: string) {
    const current = form.hobby
      ? form.hobby.split(",").map((h) => h.trim()).filter(Boolean)
      : []
    setForm((prev) => ({
      ...prev,
      hobby: current.filter((h) => h !== tag).join(", "),
    }))
  }

  function handleFileChange(name: string, file: File | null) {
    if (!file) return
    setError("")

    // 1. File size validation (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("File size exceeds the 5MB limit.")
      return
    }

    // 2. File type validation (no videos, GIFs allowed)
    if (!file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setError("Invalid file type. Only images and GIFs are allowed. Videos are not permitted.")
      return
    }

    // Store raw File object for direct Supabase CDN Storage upload on submit
    if (name === "avatar") {
      setAvatarFile(file)
    } else if (name === "banner") {
      setBannerFile(file)
    }

    // Keep base64 string for instant visual preview card rendering
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, [name]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  function handleClearFile(name: string, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (name === "avatar") {
      setAvatarFile(null)
    } else if (name === "banner") {
      setBannerFile(null)
    }
    setForm((prev) => ({ ...prev, [name]: "" }))
  }

  function handleDragOver(e: React.DragEvent, type: "avatar" | "banner") {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(true)
    } else {
      setIsBannerDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent, type: "avatar" | "banner") {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(false)
    } else {
      setIsBannerDragging(false)
    }
  }

  function handleDrop(e: React.DragEvent, type: "avatar" | "banner") {
    e.preventDefault()
    e.stopPropagation()
    if (type === "avatar") {
      setIsAvatarDragging(false)
    } else {
      setIsBannerDragging(false)
    }

    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith("image/")) {
      handleFileChange(type, file)
    }
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
      let finalAvatarUrl = form.avatar
      let finalBannerUrl = form.banner

      // Check if we are running in local development mode or if Supabase keys are not set
      const isDev = import.meta.env.DEV
      const isSupabaseConfigured = 
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co'

      // Only perform direct Supabase uploads if in production and credentials are set
      if (!isDev && isSupabaseConfigured) {
        // 1. Perform direct browser uploads to Supabase CDN Storage buckets
        if (avatarFile) {
          finalAvatarUrl = await uploadPublicFile("avatars", avatarFile)
        }
        if (bannerFile) {
          finalBannerUrl = await uploadPublicFile("banners", bannerFile)
        }
      } else {
        // In local development, finalAvatarUrl and finalBannerUrl remain as the instant local base64 strings!
        console.log("Local development mode detected: skipping CDN upload and saving base64 strings directly to database.")
      }

      // 2. Perform the signup API request with resulting public URLs instead of heavy Base64
      const success = await signup({
        ...form,
        avatar: finalAvatarUrl,
        banner: finalBannerUrl,
      })

      if (success) {
        navigate("/feed")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
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
    const interestsList = form.interests
      ? form.interests.split(",").map((i) => i.trim()).filter(Boolean)
      : []
    const hobbyList = form.hobby
      ? form.hobby.split(",").map((h) => h.trim()).filter(Boolean)
      : []

    return (
      <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
        <div>
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Tell us your story</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Select what defines you to curate your personalized homepage.
          </p>
        </div>

        {/* --- INTERESTS SECTION --- */}
        <div className="space-y-3.5 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 className="font-geist font-semibold text-title-md text-on-surface">Academic Interests</h3>
              <p className="text-body-sm text-on-surface-variant font-inter">What are you passionate about researching or studying?</p>
            </div>
          </div>

          {/* Selected Interests Tags */}
          {interestsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-1">
              {interestsList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md font-geist font-medium bg-primary/10 text-primary border border-primary/20 transition-all duration-200 animate-[scaleIn_0.2s_ease]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeInterest(tag)}
                    className="p-0.5 rounded-full hover:bg-primary/25 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom Tag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type custom interest (e.g. Robotics, AI Ethics)"
              value={customInterestInput}
              onChange={(e) => setCustomInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (customInterestInput.trim()) {
                    addInterest(customInterestInput)
                    setCustomInterestInput("")
                  }
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (customInterestInput.trim()) {
                  addInterest(customInterestInput)
                  setCustomInterestInput("")
                }
              }}
              disabled={!customInterestInput.trim()}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>

          {/* Suggestions */}
          <div>
            <span className="text-[11px] font-geist font-semibold text-on-surface-variant/60 uppercase tracking-wider block mb-1.5">Suggestions</span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {PRESET_INTERESTS.filter(tag => !interestsList.includes(tag)).map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => addInterest(tag)}
                  className="px-2.5 py-1 rounded-full text-label-sm font-geist font-medium border border-outline-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-on-surface-variant duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- HOBBIES SECTION --- */}
        <div className="space-y-3.5 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-geist font-semibold text-title-md text-on-surface">Hobbies & Activities</h3>
              <p className="text-body-sm text-on-surface-variant font-inter">What do you enjoy doing in your free time?</p>
            </div>
          </div>

          {/* Selected Hobbies Tags */}
          {hobbyList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-1">
              {hobbyList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md font-geist font-medium bg-secondary-container text-on-secondary-container border border-secondary-container/20 transition-all duration-200 animate-[scaleIn_0.2s_ease]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeHobby(tag)}
                    className="p-0.5 rounded-full hover:bg-on-secondary-container/20 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom Tag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type custom hobby (e.g. Photography, Piano)"
              value={customHobbyInput}
              onChange={(e) => setCustomHobbyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (customHobbyInput.trim()) {
                    addHobby(customHobbyInput)
                    setCustomHobbyInput("")
                  }
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (customHobbyInput.trim()) {
                  addHobby(customHobbyInput)
                  setCustomHobbyInput("")
                }
              }}
              disabled={!customHobbyInput.trim()}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>

          {/* Suggestions */}
          <div>
            <span className="text-[11px] font-geist font-semibold text-on-surface-variant/60 uppercase tracking-wider block mb-1.5">Suggestions</span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {PRESET_HOBBIES.filter(tag => !hobbyList.includes(tag)).map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => addHobby(tag)}
                  className="px-2.5 py-1 rounded-full text-label-sm font-geist font-medium border border-outline-variant hover:border-secondary hover:text-secondary-fixed-dim hover:bg-secondary-container/20 transition-all text-on-surface-variant duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderProfileStep() {
    const selectedSchool = UNIVERSITIES.find((u) => u.value === form.school)?.label || form.school || "Institution name"
    const selectedDept = DEPARTMENTS.find((d) => d.value === form.department)?.label || form.department || "Academic department"
    
    // Parse interests and hobbies
    const interestsList = form.interests
      ? form.interests.split(",").map((i) => i.trim()).filter(Boolean)
      : []
    const hobbyList = form.hobby
      ? form.hobby.split(",").map((h) => h.trim()).filter(Boolean)
      : []

    return (
      <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
        <div className="text-center sm:text-left">
          <h2 className="font-geist font-semibold text-headline-sm text-on-surface">Customize your profile</h2>
          <p className="text-body-md text-on-surface-variant font-inter mt-0.5">
            Preview how your profile will look on Scholarsphere.
          </p>
        </div>

        {/* Twitter-style Live Profile Card Mockup */}
        <div className="w-full rounded-2xl border border-outline-variant/20 overflow-hidden bg-surface-container-lowest shadow-md transition-shadow hover:shadow-lg">
          
          {/* Banner Area */}
          <div 
            className={`relative h-32 w-full transition-all duration-300 ${
              isBannerDragging 
                ? "bg-primary/20 ring-2 ring-primary ring-dashed scale-[0.99] rounded-t-2xl" 
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, "banner")}
            onDragLeave={(e) => handleDragLeave(e, "banner")}
            onDrop={(e) => handleDrop(e, "banner")}
          >
            {form.banner ? (
              <>
                <img src={form.banner} alt="Profile banner" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => handleClearFile("banner", e)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-20 hover:scale-105"
                  title="Remove banner"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              // Enhanced premium default academic banner pattern
              <div 
                className="w-full h-full bg-gradient-to-r from-primary/80 via-primary-container to-primary-fixed flex items-center justify-center cursor-pointer relative"
                onClick={() => bannerInputRef.current?.click()}
              >
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                <div className="flex flex-col items-center gap-1 text-white/80 transition-transform duration-300 hover:scale-105">
                  <Image size={20} className="animate-pulse" />
                  <span className="text-label-sm font-geist font-medium">Upload banner image</span>
                </div>
              </div>
            )}

            {/* Hidden Input for Banner */}
            <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              onChange={(e) => handleFileChange("banner", e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {/* Glassmorphic Edit Overlay on Banner when populated */}
            {form.banner && (
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 cursor-pointer text-white"
                onClick={() => bannerInputRef.current?.click()}
              >
                <Camera size={18} />
                <span className="text-label-md font-geist font-medium">Change banner</span>
              </div>
            )}

            {/* Overlapping Avatar Container */}
            <div 
              className={`absolute -bottom-8 left-6 w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-surface-container-lowest bg-surface-container-lowest overflow-hidden shadow-md group transition-all duration-300 ${
                isAvatarDragging 
                  ? "ring-2 ring-primary scale-[1.05]" 
                  : "hover:scale-[1.02]"
              }`}
              onDragOver={(e) => handleDragOver(e, "avatar")}
              onDragLeave={(e) => handleDragLeave(e, "avatar")}
              onDrop={(e) => handleDrop(e, "avatar")}
            >
              {form.avatar ? (
                <div className="w-full h-full relative">
                  <img src={form.avatar} alt="Profile avatar" className="w-full h-full object-cover" />
                  
                  {/* Glassmorphic Avatar Hover Overlay */}
                  <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center cursor-pointer text-white"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    <span className="text-[10px] font-geist font-medium mt-0.5">Change</span>
                  </div>

                  {/* Remove Button for Avatar */}
                  <button
                    type="button"
                    onClick={(e) => handleClearFile("avatar", e)}
                    className="absolute bottom-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors z-20 scale-90"
                    title="Remove photo"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-primary-container text-on-primary-container cursor-pointer transition-colors hover:bg-primary-container/80 relative"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {form.name ? (
                    <span className="text-headline-lg font-geist font-bold tracking-tight">
                      {form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  ) : (
                    <Camera size={22} className="text-on-primary-container/70" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                    <Camera size={16} />
                  </div>
                </div>
              )}

              {/* Hidden Input for Avatar */}
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={(e) => handleFileChange("avatar", e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Card Info Fields */}
          <div className="px-6 pt-11 pb-5 bg-surface-container-lowest">
            
            {/* Live Name & Username */}
            <div className="space-y-0.5">
              <h3 className="font-geist font-bold text-headline-sm text-on-surface truncate">
                {form.name || "Your Name"}
              </h3>
              <p className="text-body-md text-on-surface-variant/70 font-geist">
                {form.username ? `@${form.username.replace(/^@/, "")}` : "@username"}
              </p>
            </div>

            {/* University & Department Row */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-body-md text-on-surface-variant font-inter">
                <GraduationCap size={16} className="text-primary/70 shrink-0" />
                <span className="truncate font-medium">{selectedSchool}</span>
              </div>
              <div className="flex items-center gap-2 text-body-md text-on-surface-variant font-inter">
                <Users size={16} className="text-primary/70 shrink-0" />
                <span className="truncate">{selectedDept}</span>
              </div>
            </div>

            {/* Live Badges for Interests & Hobbies */}
            {(interestsList.length > 0 || hobbyList.length > 0) ? (
              <div className="mt-4 pt-3.5 border-t border-outline-variant/10 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {interestsList.map((interest, idx) => (
                  <span 
                    key={`interest-${idx}`} 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-geist font-medium bg-primary/10 text-primary border border-primary/10"
                  >
                    <Sparkles size={10} className="shrink-0" />
                    {interest}
                  </span>
                ))}
                {hobbyList.map((hobby, idx) => (
                  <span 
                    key={`hobby-${idx}`} 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-geist font-medium bg-secondary-container text-on-secondary-container border border-secondary-container/10"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 pt-3.5 border-t border-outline-variant/10">
                <p className="text-label-sm text-on-surface-variant/40 font-inter italic">
                  No interest tags added yet
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Clear Instructions */}
        <div className="rounded-xl bg-surface-container-low p-4 border border-outline-variant/15 flex gap-3 items-start">
          <div className="p-2 rounded-lg bg-primary-container text-on-primary-container shrink-0">
            <Upload size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="font-geist font-semibold text-title-sm text-on-surface">Tips for a great profile</h4>
            <p className="text-body-sm text-on-surface-variant font-inter leading-relaxed">
              Drag and drop files directly onto the preview card or click to browse. Max size 5MB. Recommended banner ratio: 3:1.
            </p>
          </div>
        </div>

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
