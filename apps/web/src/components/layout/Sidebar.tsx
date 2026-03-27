import React from 'react';
import { Link } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 pt-20 flex-col gap-2 p-4 bg-surface border-r border-outline-variant/20 hidden lg:flex">
      <Link to="/" className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 rounded-lg active:translate-x-1 duration-200">
        <span className="material-symbols-outlined">home</span>
        <span className="font-semibold tracking-tight">Home Feed</span>
      </Link>
      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
        <span className="material-symbols-outlined">person</span>
        <span className="font-semibold tracking-tight">My Profile</span>
      </Link>
      <Link to="/composer" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
        <span className="material-symbols-outlined">edit_document</span>
        <span className="font-semibold tracking-tight">Composer</span>
      </Link>
      <div className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
        <span className="material-symbols-outlined">bookmarks</span>
        <span className="font-semibold tracking-tight">Saved Papers</span>
      </div>

      <div className="mt-8 px-4">
        <p className="text-xs font-label text-outline mb-4 tracking-widest uppercase">My Courses</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm py-2 px-2 hover:bg-surface-container-low rounded-md cursor-pointer group">
            <span className="text-on-surface-variant group-hover:text-primary transition-colors">CS 412 - Machine Learning</span>
            <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 px-2 hover:bg-surface-container-low rounded-md cursor-pointer group">
            <span className="text-on-surface-variant group-hover:text-primary transition-colors">MATH 301 - Advanced Calculus</span>
            <span className="w-2 h-2 rounded-full bg-secondary/40 group-hover:bg-secondary transition-colors"></span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 px-2 hover:bg-surface-container-low rounded-md cursor-pointer group">
            <span className="text-on-surface-variant group-hover:text-primary transition-colors">PHYS 202 - Quantum Mechanics</span>
            <span className="w-2 h-2 rounded-full bg-tertiary/40 group-hover:bg-tertiary transition-colors"></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
