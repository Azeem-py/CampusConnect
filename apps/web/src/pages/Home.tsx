import React, { useState } from 'react';
import { PostCard } from '../components/PostCard';
import { mockPosts } from '../data/mock';

export function Home() {
  const [activeTab, setActiveTab] = useState('All Discussions');
  const tabs = ['All Discussions', 'My Courses', 'Following'];

  return (
    <div className="flex flex-col min-h-screen bg-surface dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-20 bg-surface/90 dark:bg-slate-950/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-surface-container-low dark:border-slate-800 transition-colors">
        <h1 className="text-xl font-bold tracking-tight text-primary dark:text-indigo-400">CampusConnect</h1>
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface dark:text-slate-200 cursor-pointer">tune</span>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&q=80" alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-surface-container-low dark:border-slate-800" />
        </div>
      </header>

      {/* Main Header / Feed Tabs */}
      <div className="sticky top-0 z-10 bg-surface/95 dark:bg-slate-950/95 backdrop-blur-md pt-8 px-6 pb-4 border-b border-surface-container-low dark:border-slate-800 transition-colors">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface dark:text-slate-200 mb-6 hidden md:block">Home Feed</h1>
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-semibold text-sm tracking-tight pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-primary text-primary dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-on-surface dark:hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
      </div>

      {/* Composer Input Placeholder (Desktop) */}
      <div className="hidden md:flex items-center gap-4 px-6 py-6 border-b border-surface-container-low dark:border-slate-800 bg-surface dark:bg-slate-950 hover:bg-surface-container-lowest/50 transition-colors cursor-text group">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&q=80" alt="User" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 bg-surface-container-low dark:bg-slate-900 rounded-full px-5 py-3 text-sm text-slate-500 group-hover:bg-surface dark:group-hover:bg-slate-800 transition-colors border border-transparent group-hover:border-surface-variant dark:group-hover:border-slate-700">
             Start a discussion, ask a question...
          </div>
          <button className="material-symbols-outlined p-2 text-primary bg-surface-container-low dark:bg-slate-900 rounded-full hover:bg-surface-variant transition-colors">image</button>
      </div>

      {/* Feed Content */}
      <div className="flex-1 pb-20 md:pb-0 divide-y divide-surface-container-low dark:divide-slate-800">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {/* End of Feed Placeholder */}
        <div className="p-10 text-center text-slate-400 text-sm font-mono">
            No more discussions to show.
        </div>
      </div>
    </div>
  );
}
