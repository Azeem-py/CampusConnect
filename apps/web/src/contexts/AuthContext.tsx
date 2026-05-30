import { createContext, useContext, useCallback, type ReactNode } from "react"
import { useCurrentUser, useLogin, useSignup, useLogout } from "../services/auth"

interface SignUpData {
  name: string
  username: string
  email: string
  phone: string
  department: string
  school: string
  interests: string
  hobby: string
  password: string
  confirmPassword: string
  avatar?: string
  banner?: string
}

interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string | null
  department: string | null
  school: string | null
  interests: string | null
  hobby: string | null
  role: string
  avatar: string | null
  banner: string | null
  reputationScore: number
  bio: string | null
  major: string | null
  graduationYear: number | null
  createdAt: string
  following?: { id: string }[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (data: SignUpData) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  const loginMutation = useLogin()
  const signupMutation = useSignup()
  const logoutMutation = useLogout()

  const login = useCallback(async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password })
      return true
    } catch {
      return false
    }
  }, [loginMutation])

  const signup = useCallback(async (data: SignUpData) => {
    try {
      await signupMutation.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }, [signupMutation])

  const logout = useCallback(() => {
    logoutMutation.mutate()
  }, [logoutMutation])

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
