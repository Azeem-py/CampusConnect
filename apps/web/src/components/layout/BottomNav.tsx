import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant/20 flex lg:hidden items-center justify-around px-4 py-2 pb-safe z-50">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentPath === '/' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentPath === '/' ? "font-variation-settings:'FILL' 1" : ""}`}>home</span>
        <span className="text-[10px] font-label font-bold">Home</span>
      </Link>
      <Link
        to="/directory"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentPath === '/directory' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentPath === '/directory' ? "font-variation-settings:'FILL' 1" : ""}`}>search</span>
        <span className="text-[10px] font-label font-bold">Explore</span>
      </Link>

      {/* FAB - Create Post */}
      <Link
        to="/composer"
        className="relative -top-5 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-surface"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>

      <Link
        to="/business"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentPath === '/business' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentPath === '/business' ? "font-variation-settings:'FILL' 1" : ""}`}>storefront</span>
        <span className="text-[10px] font-label font-bold">Campus</span>
      </Link>
      <Link
        to="/profile"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentPath === '/profile' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentPath === '/profile' ? "font-variation-settings:'FILL' 1" : ""}`}>person</span>
        <span className="text-[10px] font-label font-bold">Profile</span>
      </Link>
    </nav>
  );
};
