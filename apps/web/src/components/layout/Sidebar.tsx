import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { currentUser } from '../../mocks/data';

export const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, setTheme } = useTheme();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface flex flex-col py-8 z-50 border-r border-outline-variant/10 hidden lg:flex scrollbar-thin">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold tracking-tighter text-primary">CampusConnect</h1>
        <p className="text-xs font-medium text-outline uppercase tracking-widest mt-1 font-label">The Digital Commons</p>
      </div>

      <nav className="flex-1 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-4 px-6 py-4 transition-colors duration-200 active:scale-95 transition-transform ${currentPath === '/' ? 'text-primary font-semibold bg-primary/10 rounded-r-full' : 'text-on-surface-variant font-medium hover:bg-surface-container'}`}
        >
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-4 px-6 py-4 text-on-surface-variant font-medium hover:bg-surface-container transition-colors duration-200 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">search</span>
          <span>Search</span>
        </div>

        <Link
          to="/composer"
          className={`flex items-center gap-4 px-6 py-4 transition-colors duration-200 active:scale-95 transition-transform ${currentPath === '/composer' ? 'text-primary font-semibold bg-primary/10 rounded-r-full' : 'text-on-surface-variant font-medium hover:bg-surface-container'}`}
        >
          <span className="material-symbols-outlined">edit_square</span>
          <span>Create Post</span>
        </Link>

        <div className="flex items-center gap-4 px-6 py-4 text-on-surface-variant font-medium hover:bg-surface-container transition-colors duration-200 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">notifications</span>
          <span>Notifications</span>
        </div>

        <Link
          to="/profile"
          className={`flex items-center gap-4 px-6 py-4 transition-colors duration-200 active:scale-95 transition-transform ${currentPath === '/profile' ? 'text-primary font-semibold bg-primary/10 rounded-r-full' : 'text-on-surface-variant font-medium hover:bg-surface-container'}`}
        >
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </Link>

        <Link
          to="/business"
          className={`flex items-center gap-4 px-6 py-4 transition-colors duration-200 active:scale-95 transition-transform ${currentPath === '/business' ? 'text-primary font-semibold bg-primary/10 rounded-r-full' : 'text-on-surface-variant font-medium hover:bg-surface-container'}`}
        >
          <span className="material-symbols-outlined">storefront</span>
          <span>Campus Services</span>
        </Link>
      </nav>

      <div className="px-6 mt-auto">
        <div className="flex items-center justify-between py-4 border-t border-outline-variant/20 mt-4">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-sm font-bold text-on-surface">{currentUser.name}</p>
              <p className="text-xs text-on-surface-variant font-label">{currentUser.username}</p>
            </div>
          </div>
          <button
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </button>
        </div>
      </div>
    </aside>
  );
};
