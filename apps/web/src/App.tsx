import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './pages/Home';
import { StudentProfile } from './pages/StudentProfile';
import { BusinessProfile } from './pages/BusinessProfile';
import { Composer } from './pages/Composer';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans antialiased text-on-surface bg-background overflow-hidden relative">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/business" element={<BusinessProfile />} />
            <Route path="/composer" element={<Composer />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
