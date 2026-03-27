import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PostCard } from '../components/PostCard';
import { businessUser, businessProfilePosts } from '../mocks/data';

export const BusinessProfile = () => {
  return (
    <div className="max-w-screen-2xl mx-auto flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 lg:px-8 py-8 h-screen overflow-y-auto scrollbar-thin">
        {/* Profile Header */}
        <div className="relative mb-12 border-b border-outline-variant/20 pb-8">
          <div className="h-48 w-full bg-gradient-to-br from-secondary/20 to-surface-container rounded-xl mb-16 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1920&h=400" alt="Cover" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          </div>

          <div className="absolute top-32 left-8 flex items-end gap-6">
            <img
              src={businessUser.avatar}
              alt={businessUser.name}
              className="w-32 h-32 rounded-xl border-4 border-surface shadow-lg object-cover bg-surface-container"
            />
            <div className="mb-2">
              <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight flex items-center gap-2">
                {businessUser.name}
                <span className="material-symbols-outlined text-secondary bg-secondary/10 px-1 rounded text-lg">verified</span>
              </h1>
              <p className="text-on-surface-variant font-label mt-1">{businessUser.username} • {businessUser.category}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 px-8">
            <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer">
              Subscribe
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low p-2 rounded-lg shadow-sm cursor-pointer">
              map
            </button>
          </div>

          <div className="mt-8 px-8 flex flex-col gap-4">
            <p className="text-on-surface-variant leading-relaxed max-w-2xl text-[15px]">{businessUser.bio}</p>
            <div className="flex items-center gap-6 text-sm text-outline font-label uppercase tracking-wider flex-wrap">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">location_on</span>{businessUser.location}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">language</span><a href="#" className="hover:underline">{businessUser.website}</a></span>
              <span className="flex items-center gap-2 text-primary font-bold"><span className="material-symbols-outlined text-base">storefront</span>Open until 2 AM</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-8 border-b border-outline-variant/20 px-8 mb-6 overflow-x-auto scrollbar-hide">
          <button className="px-4 py-3 text-secondary font-bold border-b-2 border-secondary -mb-[2px] whitespace-nowrap cursor-pointer">Announcements</button>
          <button className="px-4 py-3 text-on-surface-variant hover:text-on-surface font-semibold transition-colors whitespace-nowrap cursor-pointer">Menu/Services</button>
          <button className="px-4 py-3 text-on-surface-variant hover:text-on-surface font-semibold transition-colors whitespace-nowrap cursor-pointer">Reviews</button>
        </div>

        <section className="flex flex-col gap-6 px-8 pb-16">
          {businessProfilePosts.map((post) => (
             <PostCard key={post.id} post={post} />
          ))}
        </section>
      </main>

      {/* Services Sidebar */}
      <aside className="hidden xl:block w-80 sticky top-24 h-[calc(100vh-6rem)] ml-8 pl-8 border-l border-outline-variant/20 pt-8 overflow-y-auto scrollbar-thin">
        <h3 className="text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-4">Promotions</h3>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
          <div className="p-3 bg-secondary/10 rounded-lg text-secondary border border-secondary/20 group cursor-pointer hover:bg-secondary/20 transition-colors">
            <h4 className="font-bold mb-1 flex items-center justify-between">Student Discount <span className="material-symbols-outlined text-sm">local_offer</span></h4>
            <p className="text-sm">10% off all espresso drinks with valid student ID.</p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-on-surface-variant border border-outline-variant/20 group cursor-pointer hover:border-outline-variant transition-colors">
             <h4 className="font-bold text-on-surface mb-1 flex items-center justify-between">Late Night Study Session <span className="material-symbols-outlined text-sm">wb_twilight</span></h4>
             <p className="text-sm">Free drip coffee refill after 10 PM.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};
