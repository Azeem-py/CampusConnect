import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { icon: 'home', path: '/', label: 'Home' },
    { icon: 'search', path: '/search', label: 'Search' },
    { icon: 'add_box', path: '/compose', label: 'Create' },
    { icon: 'notifications', path: '/notifications', label: 'Notifications' },
    { icon: 'person', path: '/profile', label: 'Profile' },
    { icon: 'storefront', path: '/services', label: 'Services' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface dark:bg-slate-950 py-8 z-50">
      <div className="px-8 mb-10">
        <h1 className="text-2xl font-bold tracking-tighter text-primary dark:text-indigo-400">CampusConnect</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1 font-mono">The Digital Commons</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={twMerge(
                'flex items-center gap-4 px-6 py-4 font-medium transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-primary dark:text-indigo-300 font-semibold bg-surface-variant dark:bg-indigo-900/30 rounded-r-full'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile */}
      <div className="mt-auto px-6">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&q=80" alt="User profile" className="w-10 h-10 rounded-full object-cover border-2 border-surface-container-low dark:border-slate-800"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface dark:text-slate-200 truncate">Elena Rodriguez</p>
            <p className="text-xs text-slate-500 font-mono truncate">@erodriguez</p>
          </div>
          <span className="material-symbols-outlined text-slate-400">more_horiz</span>
        </div>
      </div>
    </aside>
  );
}
