import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { HomePage } from "./pages/HomePage"
import { ExplorePage } from "./pages/ExplorePage"
import { ProfilePage } from "./pages/ProfilePage"
import { CreatePostPage } from "./pages/CreatePostPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { SettingsPage } from "./pages/SettingsPage"
import { PostDetailPage } from "./pages/PostDetailPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/feed" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/post/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
