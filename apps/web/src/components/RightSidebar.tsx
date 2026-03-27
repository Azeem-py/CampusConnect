import React from 'react';

export function RightSidebar() {
  const trendingTopics = [
    { id: 1, topic: 'Machine Learning', posts: '1.2k' },
    { id: 2, topic: 'Calculus III Tips', posts: '856' },
    { id: 3, topic: 'Campus Housing', posts: '432' },
    { id: 4, topic: 'Internship Fair', posts: '215' }
  ];

  const popularCourses = [
    { id: 1, course: 'CS 341', department: 'Algorithms' },
    { id: 2, course: 'MATH 225', department: 'Linear Algebra' },
    { id: 3, course: 'ECON 101', department: 'Microeconomics' }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-80 fixed right-0 top-0 h-screen overflow-y-auto bg-surface dark:bg-slate-950 py-8 px-6 z-40">
      {/* Search Input */}
      <div className="relative mb-8 group shrink-0">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
        <input
          type="text"
          placeholder="Search courses, topics, students..."
          className="w-full bg-surface-container-low dark:bg-slate-900 border-none rounded-full py-3 pl-12 pr-4 text-sm font-medium text-on-surface dark:text-slate-200 focus:ring-2 focus:ring-primary focus:bg-surface dark:focus:bg-slate-800 transition-all placeholder:text-slate-500 shadow-sm"
        />
      </div>

      {/* Context & Filters */}
      <div className="mb-10 shrink-0">
        <h2 className="text-sm font-bold tracking-tight text-on-surface dark:text-slate-200 mb-6 uppercase flex items-center justify-between">
          Trending Topics
          <span className="material-symbols-outlined text-sm text-slate-400 cursor-pointer hover:text-primary transition-colors">tune</span>
        </h2>
        <div className="space-y-1">
          {trendingTopics.map((item, index) => (
            <div key={item.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <span className="text-slate-300 font-mono text-xs font-bold w-4 mt-1">{index + 1}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-on-surface dark:text-slate-200 group-hover:text-primary transition-colors leading-tight">{item.topic}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{item.posts} discussions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Courses */}
      <div className="mb-10 shrink-0">
        <h2 className="text-sm font-bold tracking-tight text-on-surface dark:text-slate-200 mb-4 uppercase">Popular Courses</h2>
        <div className="flex flex-wrap gap-2">
          {popularCourses.map((item) => (
            <span key={item.id} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-container-low dark:bg-slate-800 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all">
              {item.course}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-slate-400 px-2">
         <a href="#" className="hover:text-primary transition-colors">Terms</a>
         <a href="#" className="hover:text-primary transition-colors">Privacy</a>
         <a href="#" className="hover:text-primary transition-colors">Cookies</a>
         <a href="#" className="hover:text-primary transition-colors">Accessibility</a>
         <span className="w-full mt-2">© 2026 The Digital Commons</span>
      </div>
    </aside>
  );
}
