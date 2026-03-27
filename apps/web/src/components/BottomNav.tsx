import React from 'react';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: PlusCircle, path: '/compose', label: 'Compose' },
    { icon: Bell, path: '/notifications', label: 'Notifications' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface dark:bg-surface-dark border-t border-border-base dark:border-border-base-dark flex justify-around items-center h-16 z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={twMerge(
              'flex flex-col items-center justify-center w-full h-full text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors',
              isActive && 'text-primary dark:text-primary-dark'
            )}
            aria-label={item.label}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
}
