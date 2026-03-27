import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Placeholder routes for navigation */}
            <Route path="/search" element={<div className="p-8 text-center text-text-secondary">Search Page</div>} />
            <Route path="/compose" element={<div className="p-8 text-center text-text-secondary">Compose Page</div>} />
            <Route path="/notifications" element={<div className="p-8 text-center text-text-secondary">Notifications Page</div>} />
            <Route path="/profile" element={<div className="p-8 text-center text-text-secondary">Profile Page</div>} />
            <Route path="/settings" element={<div className="p-8 text-center text-text-secondary">Settings Page</div>} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
