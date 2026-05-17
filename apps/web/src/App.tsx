import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { AuthProvider } from "./contexts/AuthContext"
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"
import { HomePage } from "./pages/HomePage"
import { ExplorePage } from "./pages/ExplorePage"
import { ProfilePage } from "./pages/ProfilePage"
import { CreatePostPage } from "./pages/CreatePostPage"
import { NotificationsPage } from "./pages/NotificationsPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/feed" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
