import React from 'react';

export function RightSidebar() {
  const trendingTopics = [
    { id: 1, topic: '#DataStructures', posts: '1.2k' },
    { id: 2, topic: 'Machine Learning', posts: '856' },
    { id: 3, topic: 'Calculus III Tips', posts: '432' },
  ];

  const popularCourses = [
    { id: 1, course: 'CS 341 - Algorithms', department: 'Computer Science' },
    { id: 2, course: 'MATH 225 - Linear Algebra', department: 'Mathematics' },
  ];

  return (
    <aside className="hidden lg:block w-80 fixed right-0 top-0 h-screen p-6 overflow-y-auto bg-surface dark:bg-surface-dark border-l border-border-base dark:border-border-base-dark transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Trending Topics</h2>
        <div className="space-y-4">
          {trendingTopics.map((item) => (
            <div key={item.id} className="cursor-pointer group">
              <p className="font-semibold text-text-primary dark:text-text-primary-dark group-hover:text-primary transition-colors">
                {item.topic}
              </p>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{item.posts} posts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Popular Courses</h2>
        <div className="space-y-4">
          {popularCourses.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-background dark:bg-background-dark border border-border-base dark:border-border-base-dark cursor-pointer hover:border-primary transition-colors">
              <p className="font-semibold text-text-primary dark:text-text-primary-dark">{item.course}</p>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">{item.department}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-text-secondary dark:text-text-secondary-dark flex flex-wrap gap-2">
         <a href="#" className="hover:underline">Terms</a>
         <a href="#" className="hover:underline">Privacy</a>
         <a href="#" className="hover:underline">Cookies</a>
         <span>© 2024 CampusConnect</span>
      </div>
    </aside>
  );
}
