import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { StudentProfile } from './pages/StudentProfile';
import { BusinessProfile } from './pages/BusinessProfile';
import { Composer } from './pages/Composer';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans antialiased text-on-surface bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/business" element={<BusinessProfile />} />
          <Route path="/composer" element={<Composer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
