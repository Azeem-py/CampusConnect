import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FlaskConical, Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { useAuth } from "../contexts/AuthContext"

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required.")
      return
    }

    setLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        navigate("/feed")
      } else {
        setError("No account found with that email. Please sign up first.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15">
        <div className="mx-auto max-w-7xl flex items-center h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <FlaskConical size={22} className="text-primary" />
            <span className="font-geist font-bold text-title-lg text-on-surface">
              Logos
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-geist font-bold text-headline-lg text-on-surface">
              Welcome back
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant font-inter">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6 space-y-4">
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-2.5 text-body-sm text-error font-inter">
                {error}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-[38px] text-on-surface-variant hover:text-on-surface transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button variant="primary" size="lg" className="w-full" loading={loading} type="submit">
              Sign In
              <LogIn size={16} />
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-on-surface-variant font-inter">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium no-underline transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
