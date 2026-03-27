import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PostCard } from '../components/PostCard';
import { currentUser, studentProfilePosts, answerPosts, savedPosts, userCourses } from '../mocks/data';

type Tab = 'Posts' | 'Answers' | 'Saved' | 'Courses';

export const StudentProfile = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Posts');

  return (
    <div className="max-w-screen-2xl mx-auto flex h-full bg-surface pb-20 lg:pb-0">
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin">
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
            <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm cursor-pointer">
              Follow
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low p-2 rounded-lg shadow-sm cursor-pointer">
              more_horiz
            </button>
          </div>

          <div className="mt-8 px-8 flex flex-col gap-4">
            <p className="text-on-surface-variant leading-relaxed max-w-2xl text-[15px]">{currentUser.bio}</p>
            <div className="flex items-center gap-6 text-sm text-outline font-label uppercase tracking-wider flex-wrap">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">school</span>{currentUser.major}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">calendar_today</span>{currentUser.year}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">star</span>{currentUser.reputation} Rep</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-8 border-b border-outline-variant/20 px-8 mb-6 overflow-x-auto scrollbar-hide">
          {['Posts', 'Answers', 'Saved', 'Courses'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as Tab)}
               className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === tab ? 'text-primary border-primary font-bold -mb-[2px]' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
             >
               {tab}
             </button>
          ))}
        </div>

        <section className="flex flex-col gap-6 px-8 pb-16">
          {activeTab === 'Posts' && studentProfilePosts.map((post) => <PostCard key={post.id} post={post} />)}
          {activeTab === 'Answers' && answerPosts.map((post) => <PostCard key={post.id} post={post} />)}
          {activeTab === 'Saved' && savedPosts.map((post) => <PostCard key={post.id} post={post} />)}
          {activeTab === 'Courses' && (
            <div className="flex flex-col gap-4">
               {userCourses.map(c => (
                 <div key={c.id} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
                   <h3 className="font-bold text-lg text-on-surface">{c.name}</h3>
                   <div className="flex gap-4 mt-2">
                     <span className="text-sm text-on-surface-variant font-label">{c.term}</span>
                     <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Grade: {c.grade}</span>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </section>
      </main>

      {/* Reputation Sidebar */}
      <aside className="hidden xl:block w-80 sticky top-24 h-[calc(100vh-6rem)] ml-8 pl-8 border-l border-outline-variant/20 pt-8 overflow-y-auto scrollbar-thin">
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
