import React from 'react';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface-container-low dark:bg-slate-900 text-on-surface dark:text-slate-200 transition-colors duration-300 font-sans flex">
      {/* Sidebar Wrapper */}
      <div className="w-64 hidden md:block flex-shrink-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-0 z-30 flex justify-center">
        <div className="w-full max-w-[680px] bg-surface dark:bg-slate-950 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-screen transition-all duration-300">
          {children}
        </div>
      </main>

      {/* Right Sidebar Wrapper */}
      <div className="w-80 hidden lg:block flex-shrink-0 z-40">
        <RightSidebar />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
