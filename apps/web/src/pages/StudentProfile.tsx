import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PostCard } from '../components/PostCard';
import { currentUser, posts } from '../mocks/data';

export const StudentProfile = () => {
  return (
    <div className="max-w-screen-2xl mx-auto flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 lg:px-8 py-8 h-screen overflow-y-auto">
        {/* Profile Header */}
        <div className="relative mb-12 border-b border-outline-variant/20 pb-8">
          <div className="h-48 w-full bg-gradient-primary rounded-xl mb-16 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&q=80&w=1920&h=400" alt="Cover" className="w-full h-full object-cover opacity-60" />
          </div>

          <div className="absolute top-32 left-8 flex items-end gap-6">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-32 h-32 rounded-xl border-4 border-surface shadow-lg object-cover bg-surface-container"
            />
            <div className="mb-2">
              <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">{currentUser.name}</h1>
              <p className="text-on-surface-variant font-label mt-1">{currentUser.username}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 px-8">
            <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm">
              Follow
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low p-2 rounded-lg shadow-sm">
              more_horiz
            </button>
          </div>

          <div className="mt-8 px-8 flex flex-col gap-4">
            <p className="text-on-surface-variant leading-relaxed max-w-2xl text-[15px]">{currentUser.bio}</p>
            <div className="flex items-center gap-6 text-sm text-outline font-label uppercase tracking-wider">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">school</span>{currentUser.major}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">calendar_today</span>{currentUser.year}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">star</span>{currentUser.reputation} Rep</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-8 border-b border-outline-variant/20 px-8 mb-6 overflow-x-auto">
          <button className="px-4 py-3 text-primary font-bold border-b-2 border-primary -mb-[2px] whitespace-nowrap">Posts</button>
          <button className="px-4 py-3 text-on-surface-variant hover:text-on-surface font-semibold transition-colors whitespace-nowrap">Answers</button>
          <button className="px-4 py-3 text-on-surface-variant hover:text-on-surface font-semibold transition-colors whitespace-nowrap">Saved</button>
          <button className="px-4 py-3 text-on-surface-variant hover:text-on-surface font-semibold transition-colors whitespace-nowrap">Courses</button>
        </div>

        <section className="flex flex-col gap-6 px-8 pb-16">
          <PostCard post={posts[0]} />
        </section>
      </main>

      {/* Reputation Sidebar */}
      <aside className="hidden xl:block w-80 sticky top-24 h-[calc(100vh-6rem)] ml-8 pl-8 border-l border-outline-variant/20 pt-8">
        <h3 className="text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-4">Reputation Breakdown</h3>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-on-surface text-sm font-semibold">Total Score</span>
            <span className="font-label text-primary font-bold">{currentUser.reputation}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>Answers Accepted</span>
            <span className="font-label">12</span>
          </div>
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>Helpful Votes</span>
            <span className="font-label">450</span>
          </div>
          <div className="mt-2 pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-outline leading-relaxed">Top Contributor in: <span className="text-primary font-label">#DistributedSystems</span></p>
          </div>
        </div>
      </aside>
    </div>
  );
};
