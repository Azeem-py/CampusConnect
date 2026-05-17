import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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
  avatar?: string
  banner?: string
}

interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  department: string
  school: string
  interests: string
  hobby: string
  avatar?: string
  banner?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (data: SignUpData) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("campus_user")
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email: string, _password: string) => {
    const stored = localStorage.getItem("campus_user")
    if (!stored) return false
    const u: User = JSON.parse(stored)
    if (u.email !== email) return false
    setUser(u)
    return true
  }, [])

  const signup = useCallback(async (data: SignUpData) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      department: data.department,
      school: data.school,
      interests: data.interests,
      hobby: data.hobby,
      avatar: data.avatar,
      banner: data.banner,
    }
    localStorage.setItem("campus_user", JSON.stringify(newUser))
    setUser(newUser)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("campus_user")
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
