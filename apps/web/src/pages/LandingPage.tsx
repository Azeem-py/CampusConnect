import { useEffect } from "react"
import { FileText, Database, Quote, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Footer } from "../components/layout/Footer"

const LANDING_STYLES = `
  .lp-body-lg {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    line-height: 28px;
    font-weight: 400;
  }
  .lp-label-md {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
  .lp-display {
    font-family: 'Geist', sans-serif;
    font-size: 45px;
    line-height: 52px;
    letter-spacing: -0.02em;
    font-weight: 600;
  }
  .lp-headline-lg {
    font-family: 'Geist', sans-serif;
    font-size: 32px;
    line-height: 40px;
    font-weight: 500;
  }
  .lp-headline-sm {
    font-family: 'Geist', sans-serif;
    font-size: 24px;
    line-height: 32px;
    font-weight: 500;
  }
  .lp-body-md {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
  }
  .lp-title-lg {
    font-family: 'Geist', sans-serif;
    font-size: 22px;
    line-height: 28px;
    font-weight: 500;
  }

  @media (min-width: 768px) {
    .lp-display {
      font-size: 57px;
      line-height: 64px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

export function LandingPage() {
  useEffect(() => {
    const id = "lp-landing-styles"
    if (document.getElementById(id)) return
    const style = document.createElement("style")
    style.id = id
    style.textContent = LANDING_STYLES
    document.head.appendChild(style)
    return () => { document.getElementById(id)?.remove() }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-5 md:px-20 h-20 flex items-center justify-between">
          <div className="font-geist font-bold tracking-tight text-on-surface lp-headline-sm">
            Logos
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {["Product", "About Us", "Support", "Pricing"].map((label) => (
              <a
                key={label}
                href="#"
                className="lp-label-md text-on-surface-variant hover:text-primary transition-colors no-underline"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden md:block lp-label-md text-on-surface hover:text-primary transition-colors no-underline"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-primary text-on-primary lp-body-md font-semibold px-4 py-2 rounded transition-transform duration-150 active:scale-95 hover:opacity-80 no-underline inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-5 md:px-20 pt-24 pb-16 md:pt-32 md:pb-24 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 lg:col-span-6 space-y-8">
            <h1 className="lp-display text-on-surface">
              Clarity in <br className="hidden md:block"/>a complex world.
            </h1>
            <p className="lp-body-lg text-on-surface-variant max-w-lg">
              Logos delivers high-end editorial tools for professionals who demand truth, precision, and intellectual rigor in their reporting and analysis.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/signup"
                className="bg-primary text-on-primary lp-body-md font-semibold px-6 py-3 rounded hover:opacity-90 transition-opacity no-underline inline-block"
              >
                Start Publishing
              </Link>
              <button className="border border-outline text-on-surface lp-body-md font-semibold px-6 py-3 rounded hover:bg-surface-variant transition-colors">
                Read the Manifesto
              </button>
            </div>
          </div>
          <div className="md:col-span-5 lg:col-span-6 mt-12 md:mt-0 relative">
            <div className="aspect-square bg-surface-container rounded border border-outline-variant overflow-hidden relative group">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt="A minimalist abstract digital illustration representing journalistic clarity and structure. Geometric shapes overlapping in calm, high-key lighting. Academic indigo and gold accents against a pristine white background."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAv3zgoNvAQp1nhwHnR8m6Lxociz3KtzVAIizbGD6pTAEUny6C977XzZcWQYmrk2ETcbK9utik_h3muePXA0V8RlNTAvzbCWapWQxXjq_GktxFxv1DEhqZPmzyOLX4oEbXJSjnYjfnNPeYTZN4x4iUSiHLm4W2bz_dS2xFjTFkIka9Rd4KogyP75m5z9H02nH_TG2Fv8W4NgcAcIAqFadp9_D4s3j1Ggp-FASXGWIqmm9ufHjKJA6Uxh9FrSWgkNM5ymPvhmO-znKr8"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-surface/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="border-y border-outline-variant bg-surface-container-low py-12">
          <div className="max-w-7xl mx-auto px-5 md:px-20 text-center">
            <p className="lp-label-md text-on-surface-variant uppercase tracking-widest mb-8">
              Trusted by leading newsrooms and analysts
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
              {["The Atlantic", "Reuters", "Bloomberg", "ProPublica"].map((name) => (
                <div key={name} className="font-geist font-bold lp-headline-sm text-on-surface">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Bento Grid ── */}
        <section className="max-w-7xl mx-auto px-5 md:px-20 py-16">
          <div className="max-w-2xl mb-12">
            <h2 className="lp-headline-lg text-on-surface mb-4">Architected for deep focus.</h2>
            <p className="lp-body-lg text-on-surface-variant">
              Our platform strips away the noise, leaving only the tools necessary for rigorous investigation and polished publication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Feature 1: Large */}
            <div className="bg-surface border border-outline-variant rounded p-6 md:col-span-2 row-span-2 flex flex-col justify-between group hover:border-primary transition-colors">
              <div className="space-y-4">
                <FileText className="text-primary" size={36} />
                <h3 className="lp-title-lg text-on-surface">Fluid Editorial Grid</h3>
                <p className="lp-body-md text-on-surface-variant max-w-md">
                  Write without constraint. Our fluid grid dynamically adjusts line lengths for optimal readability across any device, maintaining perfect typographical rhythm.
                </p>
              </div>
              <div className="mt-8 h-48 bg-surface-container rounded overflow-hidden">
                <img
                  className="w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:opacity-100 transition-opacity"
                  alt="A clean, minimalist UI dashboard showing a sophisticated text editor with a sidebar for metadata."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4-j0kJ2U_MV9uLK6oGTTKNA0Bwspcufp8N2RvsW9iKRj0SsHz9PgABp5ID9OmN9u6hekmY_gTcp4wrzrHVxFJ3Gc43OXE6VTPQGPaDcJnuoUJXObCnQBvKUjIX15Sh_RlG6i4SxqeJRvtf8_mCKSn6pn-yNcQrQtDmrYLdRw9J6a0xeRp_Soq967M9cTpxD1BtsUKc3htJvR64ET-bY5onTGyqbuNCvnMuE3r4JAc42oob6gWlvxy-cAtZ5ByvWXCQRY8GpuzwsCV"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface border border-outline-variant rounded p-6 flex flex-col justify-between hover:border-primary transition-colors">
              <Database className="text-tertiary" size={28} />
              <div>
                <h3 className="lp-headline-sm text-on-surface mb-2">Data Transparency</h3>
                <p className="lp-body-md text-on-surface-variant">Embed datasets directly into your narrative with monospaced precision.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface border border-outline-variant rounded p-6 flex flex-col justify-between hover:border-primary transition-colors">
              <Quote className="text-secondary" size={28} />
              <div>
                <h3 className="lp-headline-sm text-on-surface mb-2">Source Attribution</h3>
                <p className="lp-body-md text-on-surface-variant">Automated, highly-styled citation blocks that build reader trust.</p>
              </div>
            </div>

            {/* Feature 4: Wide */}
            <div className="bg-surface border border-outline-variant rounded p-6 md:col-span-3 flex flex-col md:flex-row items-center gap-8 hover:border-primary transition-colors">
              <div className="flex-1 space-y-4">
                <Share2 className="text-primary" size={28} />
                <h3 className="lp-title-lg text-on-surface">Systematic Precision</h3>
                <p className="lp-body-md text-on-surface-variant">Leverage a tokenized design system that ensures visual consistency across complex investigative reports and multi-part series.</p>
              </div>
              <div className="flex-1 w-full h-32 bg-surface-container rounded overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                    <div className="bg-primary w-2/3 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="bg-surface-container py-16 border-y border-outline-variant">
          <div className="max-w-7xl mx-auto px-5 md:px-20">
            <h2 className="lp-headline-lg text-on-surface mb-16 text-center">The Editorial Process</h2>
            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-6 left-0 w-full h-px bg-outline-variant z-0" />

              {[
                { num: "01", title: "Investigate", desc: "Gather primary sources and raw data into a unified, secure workspace." },
                { num: "02", title: "Synthesize", desc: "Draft narratives with distraction-free focus, organizing complex timelines." },
                { num: "03", title: "Refine", desc: "Apply academic rigor with automated fact-checking and citation tools." },
                { num: "04", title: "Publish", desc: "Deploy to a fluid editorial layout designed for deep reading." },
              ].map((step, i) => (
                <div key={step.num} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-surface border-2 flex items-center justify-center lp-label-md mb-6 ${i === 0 ? "border-primary text-primary" : "border-outline-variant text-on-surface-variant"}`}
                  >
                    {step.num}
                  </div>
                  <h4 className="lp-title-lg text-on-surface mb-2">{step.title}</h4>
                  <p className="lp-body-md text-on-surface-variant">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-7xl mx-auto px-5 md:px-20 py-16 mb-12">
          <div className="bg-inverse-surface rounded-xl p-12 text-center flex flex-col items-center justify-center border border-outline-variant">
            <h2 className="lp-headline-lg text-inverse-on-surface mb-6 max-w-2xl">Elevate your reporting standard today.</h2>
            <p className="lp-body-lg text-surface-variant max-w-xl mb-8">
              Join the vanguard of digital journalism. Start your free 14-day trial of Logos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button className="bg-tertiary text-on-tertiary lp-label-md font-bold px-8 py-4 rounded uppercase tracking-wider hover:opacity-90 transition-opacity">
                Request Access
              </button>
              <button className="bg-transparent border border-outline text-inverse-on-surface lp-body-md font-semibold px-8 py-4 rounded hover:bg-surface-variant/10 transition-colors">
                View Pricing
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
