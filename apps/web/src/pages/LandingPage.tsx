import { Search, FlaskConical, Sigma, School, Smartphone, Laptop, ArrowRight } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Tag } from "../components/ui/Tag"
import { Avatar } from "../components/ui/Avatar"
import { Footer } from "../components/layout/Footer"
import { Link } from "react-router-dom"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <FlaskConical size={22} className="text-primary" />
            <span className="font-geist font-bold text-title-lg text-on-surface">
              Scholarsphere
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">Research</a>
            <a href="#" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">Departments</a>
            <a href="#" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">Events</a>
            <a href="#" className="text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline">Publications</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-40 lg:w-48 pl-9 pr-3 bg-surface-container border border-outline-variant/20 rounded text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Join Scholar</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 lg:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-geist font-bold text-display-xl text-on-surface">
              Where Academic Minds Connect
            </h1>
            <p className="mt-4 text-body-lg text-on-surface-variant font-inter leading-relaxed max-w-lg">
              The first social platform built specifically for students and researchers. Share insights, solve complex problems with built-in LaTeX support, and stay updated with campus life.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Join the Conversation
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="secondary" size="lg">
                  Explore Research
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name="Dr. Rivera" size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-geist font-semibold text-title-md text-on-surface">Dr. Rivera</span>
                  <Tag variant="department">PHYS-401</Tag>
                </div>
                <span className="text-body-sm text-on-surface-variant font-inter">@physics_dept · 2h</span>
              </div>
            </div>
            <p className="text-body-md text-on-surface font-inter leading-relaxed">
              Fascinating derivation for the quantum harmonic oscillator ground state today. Notice how the uncertainty principle naturally arises:
            </p>
            <div className="my-2 pl-4 border-l-2 border-primary bg-surface-container/50 py-3 pr-4 rounded-r-md overflow-x-auto text-sm">
              <p className="font-mono text-on-surface">{`$$\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}$$`}</p>
              <p className="font-mono text-on-surface mt-1">{`$$\\psi_0(x) = \\left(\\frac{m\\omega}{\\pi\\hbar}\\right)^{1/4} e^{-\\frac{m\\omega x^2}{2\\hbar}}$$`}</p>
            </div>
            <div className="flex items-center gap-4 pt-1 text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-label-sm font-geist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
                24
              </span>
              <span className="flex items-center gap-1.5 text-label-sm font-geist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Cite
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low/50 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="font-geist font-bold text-headline-lg text-on-surface">
              Designed for Academic Rigor
            </h2>
            <p className="mt-2 text-on-surface-variant font-inter text-body-md">
              We stripped away the noise so you can focus on the signal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Sigma size={20} />
              </div>
              <h3 className="font-geist font-semibold text-title-lg text-on-surface">Math as a First-Class Citizen</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant font-inter leading-relaxed">
                Native LaTeX rendering. No more clumsy image uploads or unreadable ASCII math.
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <School size={20} />
              </div>
              <h3 className="font-geist font-semibold text-title-lg text-on-surface">Departmental Pulse</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant font-inter leading-relaxed">
                Follow course tags like CS-101 or BIO-L3 to filter the feed and never miss updates.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Tag variant="trending">#MachineLearning</Tag>
                <Tag variant="trending">#QuantumComputing</Tag>
                <Tag variant="trending">#Linguistics</Tag>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <div className="flex gap-1">
                  <Smartphone size={20} />
                  <Laptop size={20} />
                </div>
              </div>
              <h3 className="font-geist font-semibold text-title-lg text-on-surface">Mobile &amp; Desktop Seamlessness</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant font-inter leading-relaxed">
                A unified experience designed for the modern academic workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 lg:px-6 py-16 lg:py-20 text-center">
        <h2 className="font-geist font-bold text-headline-lg text-on-surface">
          Ready to Elevate Your Discourse?
        </h2>
        <p className="mt-2 text-on-surface-variant font-inter text-body-md">
          Join thousands of students and researchers already building a smarter community.
        </p>
        <div className="mt-6">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Sign Up
            </Button>
          </Link>
        </div>
        <p className="mt-3 text-body-sm text-on-surface-variant/60 font-inter">
          Requires a valid institutional email address.
        </p>
      </section>

      <Footer />
    </div>
  )
}
