import React from 'react';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">CampusConnect</div>
          <div className="nav-links">
            <a href="#" className="nav-link">Social Feed</a>
            <a href="#" className="nav-link">Course Rooms</a>
            <a href="#" className="nav-link">Governance</a>
            <a href="#" className="nav-link">Business</a>
            <a href="#" className="btn-pill">Login / Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="bento-grid">
            {/* Main Headline Card */}
            <div className="bento-card col-span-8 animate-in" style={{ justifyContent: 'center' }}>
              <div className="tag-mono" style={{ marginBottom: '1rem' }}>Evolution 1.0</div>
              <h1 className="headline-xl">
                Academic Discourse meets <span className="italic-serif">Social Networking</span>.
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '580px' }}>
                A premium, installable ecosystem designed for recursive scholarly engagement and fast-paced campus commerce.
              </p>
            </div>

            {/* LaTeX Equation Card */}
            <div className="bento-card col-span-4 tinted animate-in" style={{ animationDelay: '0.1s' }}>
              <div className="tag-mono" style={{ alignSelf: 'center' }}>Schrödinger Eq.</div>
              <div className="latex-block">
                iℏ <span style={{ opacity: 0.6 }}>∂</span>/∂t Ψ = ĤΨ
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Native browser-based LaTeX rendering for statistical and theoretical models.
              </p>
            </div>

            {/* Social Pulse Feed Preview */}
            <div className="bento-card col-span-4 animate-in" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-indigo)', border: '3px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}></div>
                <div>
                   <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Elena Rodriguez</div>
                   <div className="tag-mono" style={{ color: 'var(--color-primary-indigo)', fontSize: '0.65rem' }}>PhD Scholar · Verified</div>
                </div>
              </div>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                "Just shared my notes on the <span style={{ color: 'var(--color-accent-gold)', fontWeight: '600' }}>Black-Scholes</span> derivation in the Finance room. Native LaTeX makes it so much cleaner!"
              </p>
              <div style={{ display: 'flex', gap: '2rem', marginTop: 'auto' }}>
                 <div style={{ color: 'var(--color-accent-gold)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>↑</span> 1.4k
                 </div>
                 <div style={{ color: 'var(--color-scholarly-slate)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🗣️</span> 42
                 </div>
              </div>
            </div>

            {/* PWA / Visual Banner */}
            <div className="bento-card col-span-8 indigo-bg animate-in" style={{ animationDelay: '0.3s', minHeight: '300px' }}>
               <div style={{ maxWidth: '400px', marginTop: 'auto' }}>
                  <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem' }}>Work Offline.</h2>
                  <p style={{ opacity: 0.8, color: 'var(--color-parchment-white)' }}>
                    Draft technical posts and upvote research while traveling. CampusConnect syncs instantly when you reconnect.
                  </p>
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                     <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '2rem', fontSize: '0.8rem' }}>Desktop Native</div>
                     <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '2rem', fontSize: '0.8rem' }}>Background Sync</div>
                  </div>
               </div>
               <div style={{ position: 'absolute', right: '-10%', top: '10%', fontSize: '12rem', opacity: 0.05, fontWeight: '900', userSelect: 'none' }}>
                  PWA
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="pwa-section tinted">
         <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '4rem' }}>Optimized for Excellence.</h2>
            <div className="grid-3">
               <div className="bento-card">
                  <span className="feature-icon">☁️</span>
                  <h3 style={{ marginBottom: '1rem' }}>Full Offline Sync</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Service workers manage your local database, allowing for seamless reading and drafting without an internet connection.</p>
               </div>
               <div className="bento-card">
                  <span className="feature-icon">🏅</span>
                  <h3 style={{ marginBottom: '1rem' }}>Verified .edu Ecosystem</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Connect your university domain to unlock exclusive institutional feeds and earn restricted-entry reputation badges.</p>
               </div>
               <div className="bento-card">
                  <span className="feature-icon">🚀</span>
                  <h3 style={{ marginBottom: '1rem' }}>One-Tap Install</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>No app stores needed. Install CampusConnect directly from your browser to your mobile home screen or desktop taskbar.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer>
         <div className="container">
            <div className="footer-content">
               <div className="logo">CampusConnect</div>
               <div style={{ display: 'flex', gap: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <div className="tag-mono" style={{ marginBottom: '0.5rem' }}>Network</div>
                     <a href="#" style={{ fontSize: '0.9rem' }}>Social Feed</a>
                     <a href="#" style={{ fontSize: '0.9rem' }}>Courses</a>
                     <a href="#" style={{ fontSize: '0.9rem' }}>Businesses</a>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <div className="tag-mono" style={{ marginBottom: '0.5rem' }}>Legal</div>
                     <a href="#" style={{ fontSize: '0.9rem' }}>Privacy Policy</a>
                     <a href="#" style={{ fontSize: '0.9rem' }}>Terms of Use</a>
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>© 2026 CampusConnect Platform.</p>
                  <p className="tag-mono" style={{ marginTop: '0.5rem' }}>Institutional Integrity First</p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};
