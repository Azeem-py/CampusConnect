import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav className="w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter text-primary">
            CampusConnect
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-primary font-semibold transition-colors">Feed</Link>
            <Link to="/directory" className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-2 py-1 rounded">Directory</Link>
            <Link to="/events" className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-2 py-1 rounded">Events</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            search
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            notifications
          </button>
          <Link to="/profile">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
              alt="Profile avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-primary transition-all cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};
