import React from 'react';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text-primary dark:text-text-primary-dark transition-colors duration-300 flex">
      <Sidebar />

      <main className="flex-1 w-full md:ml-64 lg:mr-80 pb-20 md:pb-0">
        <div className="max-w-[680px] mx-auto min-h-screen border-x border-border-base dark:border-border-base-dark bg-surface dark:bg-surface-dark transition-colors duration-300">
          {children}
        </div>
      </main>

      <RightSidebar />
      <BottomNav />
    </div>
  );
}
