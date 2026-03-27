import React from 'react';

export const RightSidebar = () => {
  return (
    <aside className="hidden xl:block w-80 sticky top-24 h-[calc(100vh-6rem)] ml-8 pl-8 border-l border-outline-variant/20">
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-4">Trending on Campus</h3>
          <div className="flex flex-col gap-4">
            <div className="group cursor-pointer">
              <p className="text-xs text-outline mb-1 font-label">#1 Trending - Academics</p>
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Midterm Survival Guide</h4>
              <p className="text-sm text-on-surface-variant mt-1">1.2k students discussing</p>
            </div>
            <div className="group cursor-pointer">
              <p className="text-xs text-outline mb-1 font-label">#2 Trending - Events</p>
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Career Fair '24 Companies</h4>
              <p className="text-sm text-on-surface-variant mt-1">856 students discussing</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=150&h=150" alt="Cafe sponsor" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-xs font-label px-2 py-1 bg-surface rounded text-outline-variant">Promoted</span>
          </div>
          <h4 className="font-bold text-on-surface">Midnight Roasters</h4>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">Flash sale! Show your student ID for 50% off all cold brew until 3 AM tonight. Fuel up for finals week.</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-outline font-label mt-auto">
          <span className="hover:text-primary cursor-pointer transition-colors">About</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
          <span>© 2024</span>
        </div>
      </div>
    </aside>
  );
};
