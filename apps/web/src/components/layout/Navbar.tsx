import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';

export const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex lg:hidden items-center justify-between px-6 h-16 max-w-none">
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:bg-surface-container transition-colors p-2 rounded-full active:scale-95 duration-150 cursor-pointer">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-primary font-bold tracking-tighter text-lg font-headline">CampusConnect</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30">
          <img alt="Profile" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150" />
        </div>
      </div>
    </header>
  );
};
