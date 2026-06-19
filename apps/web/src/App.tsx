import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { AppLayout } from "./components/layout/AppLayout"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { HomePage } from "./pages/HomePage"
import { ExplorePage } from "./pages/ExplorePage"
import { ProfilePage } from "./pages/ProfilePage"
import { CreatePostPage } from "./pages/CreatePostPage"
import { CreateNotePage } from "./pages/CreateNotePage"
import { NoteDetailPage } from "./pages/NoteDetailPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { SettingsPage } from "./pages/SettingsPage"
import { PostDetailPage } from "./pages/PostDetailPage"
import { AdminLayout } from "./pages/admin/AdminLayout"
import { AdminDashboard } from "./pages/admin/AdminDashboard"
import { AdminReportsPage } from "./pages/admin/AdminReportsPage"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { AdminInstitutionsPage } from "./pages/admin/AdminInstitutionsPage"
import { AdminContentPage } from "./pages/admin/AdminContentPage"
import { AdminBannedWordsPage } from "./pages/admin/AdminBannedWordsPage"
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage"
import { CommunitiesPage } from "./pages/communities"
import { CreateCommunityPage } from "./pages/communities/create"
import { CommunityLayout } from "./pages/communities/[id]"
import { CommunityMembersPage } from "./pages/communities/[id]/members"
import { CommunitySettingsPage } from "./pages/communities/[id]/settings"
import { CommunityRequestsPage } from "./pages/communities/[id]/requests"
import { CommunityGroupsPage } from "./pages/communities/[id]/groups"
import { GroupDetailPage } from "./pages/communities/[id]/groups/[groupId]"
import { QuizzesPage } from "./pages/communities/[id]/groups/[groupId]/quizzes"
import { CreateQuizPage } from "./pages/communities/[id]/groups/[groupId]/quizzes/create"
import { QuizDetailPage } from "./pages/communities/[id]/groups/[groupId]/quizzes/[quizId]"
import { TakeQuizPage } from "./pages/communities/[id]/groups/[groupId]/quizzes/[quizId]/take"
import { AttemptResultPage } from "./pages/communities/[id]/groups/[groupId]/quizzes/[quizId]/attempt/[attemptId]"

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
  const [toastPosition, setToastPosition] = useState<"top-center" | "top-right">("top-right")

  useEffect(() => {
    const checkWidth = () => setToastPosition(window.innerWidth < 768 ? "top-center" : "top-right")
    checkWidth()
    window.addEventListener("resize", checkWidth)
    return () => window.removeEventListener("resize", checkWidth)
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/feed" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/notes/create" element={<ProtectedRoute><CreateNotePage /></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><NoteDetailPage /></ProtectedRoute>} />
            <Route path="/notes/:id/edit" element={<ProtectedRoute><CreateNotePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/post/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
            <Route path="/moderation" element={<Navigate to="/admin/reports" replace />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="institutions" element={<AdminInstitutionsPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="banned-words" element={<AdminBannedWordsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>
            <Route path="/communities" element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>} />
            <Route path="/communities/create" element={<ProtectedRoute><CreateCommunityPage /></ProtectedRoute>} />
            <Route path="/communities/:id" element={<ProtectedRoute><CommunityLayout /></ProtectedRoute>}>
              <Route index element={null} />
              <Route path="members" element={<CommunityMembersPage />} />
              <Route path="settings" element={<CommunitySettingsPage />} />
              <Route path="requests" element={<CommunityRequestsPage />} />
              <Route path="groups" element={<CommunityGroupsPage />} />
              <Route path="groups/:groupId" element={<GroupDetailPage />} />
              <Route path="groups/:groupId/quizzes" element={<QuizzesPage />} />
              <Route path="groups/:groupId/quizzes/create" element={<CreateQuizPage />} />
              <Route path="groups/:groupId/quizzes/:quizId" element={<QuizDetailPage />} />
              <Route path="groups/:groupId/quizzes/:quizId/take" element={<TakeQuizPage />} />
              <Route path="groups/:groupId/quizzes/:quizId/attempt/:attemptId" element={<AttemptResultPage />} />
            </Route>
          </Routes>
          <Toaster position={toastPosition} richColors closeButton />
        </AppLayout>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
