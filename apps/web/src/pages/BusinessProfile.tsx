import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PostCard } from '../components/PostCard';
import { businessUser, businessProfilePosts, businessServices, businessReviews } from '../mocks/data';

type Tab = 'Announcements' | 'Menu/Services' | 'Reviews';

export const BusinessProfile = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Announcements');

  return (
    <div className="w-full max-w-screen-2xl mx-auto flex h-screen bg-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 lg:ml-64 xl:mr-80 lg:px-0 py-0 lg:py-8 lg:px-8 h-full overflow-y-auto scrollbar-thin pb-24 lg:pb-8">
        {/* Profile Header */}
        <div className="relative mb-12 border-b border-outline-variant/20 pb-8">
          <div className="h-48 w-full bg-gradient-to-br from-secondary/20 to-surface-container lg:rounded-xl mb-16 overflow-hidden">
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
          {['Announcements', 'Menu/Services', 'Reviews'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as Tab)}
               className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === tab ? 'text-secondary border-secondary font-bold -mb-[2px]' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
             >
               {tab}
             </button>
          ))}
        </div>

        <section className="flex flex-col gap-6 px-8 pb-16">
          {activeTab === 'Announcements' && businessProfilePosts.map((post) => <PostCard key={post.id} post={post} />)}
          {activeTab === 'Menu/Services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {businessServices.map(s => (
                 <div key={s.id} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-between">
                   <div>
                     <h3 className="font-bold text-lg text-on-surface">{s.name}</h3>
                     <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{s.description}</p>
                   </div>
                   <span className="text-secondary font-label font-bold mt-4">{s.price}</span>
                 </div>
               ))}
            </div>
          )}
          {activeTab === 'Reviews' && (
             <div className="flex flex-col gap-4">
               {businessReviews.map(r => (
                 <div key={r.id} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
                   <div className="flex justify-between items-center mb-3">
                     <span className="font-bold text-on-surface">{r.user}</span>
                     <div className="flex text-amber-500">
                       {[...Array(5)].map((_, i) => (
                         <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? "font-variation-settings:'FILL' 1" : ""}`}>star</span>
                       ))}
                     </div>
                   </div>
                   <p className="text-on-surface-variant text-sm italic">"{r.text}"</p>
                 </div>
               ))}
             </div>
          )}
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
