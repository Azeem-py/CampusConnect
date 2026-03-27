import React from 'react';
import { PostCard } from '../components/PostCard';
import { mockPosts } from '../data/mock';

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-10 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-base dark:border-border-base-dark p-4 flex items-center justify-center transition-colors">
        <h1 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-primary-dark">
          CampusConnect
        </h1>
      </header>

      {/* Desktop Header / Feed Tabs */}
      <div className="hidden md:flex sticky top-0 z-10 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-base dark:border-border-base-dark p-4 transition-colors items-center gap-6 font-semibold">
          <button className="text-primary dark:text-primary-dark border-b-2 border-primary dark:border-primary-dark pb-1">For You</button>
          <button className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors pb-1">Following</button>
      </div>

      <div className="flex-1">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
