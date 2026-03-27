import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { PostCard } from '../components/PostCard';
import { posts, currentUser } from '../mocks/data';
import { useTheme } from '../components/ThemeProvider';

export const Home = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-screen-2xl mx-auto flex h-full">
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 lg:px-8 px-4 py-6 md:py-8 h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin pb-24 md:pb-8">
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Your Network</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="md:hidden material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low p-2 rounded-lg cursor-pointer"
              >
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </button>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low p-2 rounded-lg cursor-pointer">
                tune
              </button>
            </div>
          </div>

          {/* Create Post Input */}
          <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl shadow-sm border border-outline-variant/10 cursor-text hidden md:flex">
            <img src={currentUser.avatar} alt="Your avatar" className="w-10 h-10 rounded-full object-cover" />
            <input
              type="text"
              placeholder="Share a theorem, question, or thought..."
              className="bg-transparent border-none outline-none flex-1 text-on-surface placeholder:text-outline text-sm font-body"
            />
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors">functions</span>
              <span className="material-symbols-outlined p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors">image</span>
              <button className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg font-semibold text-sm transition-colors ml-2 shadow-sm cursor-pointer">
                Post
              </button>
            </div>
          </div>

          {/* Feed Filter Chips */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button className="px-4 py-1.5 rounded-full text-sm font-label font-bold bg-primary text-on-primary shadow-sm whitespace-nowrap cursor-pointer">For You</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-label text-on-surface-variant bg-surface border border-outline-variant/20 hover:bg-surface-container-low transition-colors whitespace-nowrap cursor-pointer">Following</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-label text-on-surface-variant bg-surface border border-outline-variant/20 hover:bg-surface-container-low transition-colors whitespace-nowrap cursor-pointer">#CS450</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-label text-on-surface-variant bg-surface border border-outline-variant/20 hover:bg-surface-container-low transition-colors whitespace-nowrap cursor-pointer">#MATH210</button>
          </div>
        </header>

        <section className="flex flex-col gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </main>

      <RightSidebar />
    </div>
  );
};
