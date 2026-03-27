import React from 'react';
import { Home, Search, Bell, User, Settings, PenSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Explore' },
    { icon: Bell, path: '/notifications', label: 'Notifications' },
    { icon: User, path: '/profile', label: 'Profile' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border-base dark:border-border-base-dark p-4 bg-surface dark:bg-surface-dark transition-colors duration-300">
      <div className="flex items-center gap-2 px-4 py-6 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          C
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-primary-dark">CampusConnect</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={twMerge(
                'flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary dark:text-primary-dark'
                  : 'text-text-primary dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <item.icon className={twMerge("w-6 h-6", isActive && "fill-current")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Link
          to="/compose"
          className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition-colors shadow-sm"
        >
          <PenSquare className="w-5 h-5" />
          Create Post
        </Link>
      </div>
    </aside>
  );
}
