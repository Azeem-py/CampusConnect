import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: 'home', path: '/', label: 'Home' },
    { icon: 'search', path: '/search', label: 'Search' },
    { icon: 'add_box', path: '/compose', label: 'Create' },
    { icon: 'notifications', path: '/notifications', label: 'Notifications' },
    { icon: 'person', path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface dark:bg-slate-950 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex justify-around items-center h-16 z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={twMerge(
              'flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary transition-colors',
              isActive && 'text-primary'
            )}
            aria-label={item.label}
          >
            <span className={twMerge("material-symbols-outlined", isActive && "font-variation-settings-'FILL' 1")}>{item.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
