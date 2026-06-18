import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import {
  FlaskConical,
  ArrowRight,
  Sigma,
  Users,
  Brain,
  Smartphone,
  ArrowUpDown,
  Shield,
  Sparkles,
  GraduationCap,
  BookOpen,
  MessageSquare,
  ChevronUp,
  Star,
  Bell,
  TrendingUp,
  Award,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Tag } from "../components/ui/Tag"
import { Avatar } from "../components/ui/Avatar"
import { Footer } from "../components/layout/Footer"
import { Link } from "react-router-dom"

/* ================================================================== */
/*  LANDING PAGE CSS — injected once via <style>                       */
/*  All animations are GPU-accelerated (transform + opacity only)      */
/* ================================================================== */
const LANDING_STYLES = `
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-12px) rotate(1deg); }
    66% { transform: translateY(6px) rotate(-1deg); }
  }
  @keyframes lp-float-slow {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes lp-pulse-ring {
    0% { transform: scale(1); opacity: 0.3; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes lp-gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes lp-shimmer-line {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes lp-typing-cursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes lp-tilt-in {
    from { transform: perspective(800px) rotateY(-8deg) translateX(-20px); opacity: 0; }
    to { transform: perspective(800px) rotateY(0deg) translateX(0); opacity: 1; }
  }
  @keyframes lp-slide-in-right {
    from { transform: translateX(40px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes lp-scale-bounce {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes lp-number-glow {
    0%, 100% { text-shadow: 0 0 0px transparent; }
    50% { text-shadow: 0 0 20px color-mix(in srgb, var(--color-primary) 30%, transparent); }
  }
  @keyframes lp-orb-drift-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -40px) scale(1.1); }
    50% { transform: translate(-20px, -60px) scale(0.95); }
    75% { transform: translate(40px, -20px) scale(1.05); }
  }
  @keyframes lp-orb-drift-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-40px, 30px) scale(1.08); }
    66% { transform: translate(20px, 50px) scale(0.92); }
  }
  @keyframes lp-hero-badge-float {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes lp-card-glow {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50% { box-shadow: 0 0 30px -5px color-mix(in srgb, var(--color-primary) 12%, transparent); }
  }

  .lp-gradient-text {
    background-size: 200% 200%;
    animation: lp-gradient-shift 6s ease infinite;
  }
  .lp-feature-card {
    transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.3s ease;
  }
  .lp-feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1);
  }
  .lp-community-card {
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .lp-community-card:hover {
    transform: translateX(6px);
  }
  .lp-stat-card {
    transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease;
  }
  .lp-stat-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1);
  }
  .lp-stat-card:hover .lp-stat-icon {
    transform: scale(1.15) rotate(5deg);
  }
  .lp-stat-icon {
    transition: transform 0.35s cubic-bezier(.34,1.56,.64,1);
  }
  .lp-cta-btn-glow {
    position: relative;
  }
  .lp-cta-btn-glow::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--color-primary), var(--color-tertiary-container));
    opacity: 0;
    z-index: -1;
    filter: blur(12px);
    transition: opacity 0.4s ease;
  }
  .lp-cta-btn-glow:hover::after {
    opacity: 0.4;
  }
  .lp-hero-post {
    transition: transform 0.5s cubic-bezier(.34,1.56,.64,1), box-shadow 0.5s ease;
  }
  .lp-hero-post:hover {
    transform: translateY(-4px) rotate(0.5deg);
    box-shadow: 0 25px 60px -12px rgba(0,0,0,0.15);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

/* ------------------------------------------------------------------ */
/*  Scroll-triggered reveal (GPU-composited)                          */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
}: {
  children: ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade-left" | "fade-right" | "tilt-in" | "scale" | "slide-right"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const styles: Record<string, { from: React.CSSProperties; to: React.CSSProperties }> = {
    "fade-up": {
      from: { opacity: 0, transform: "translateY(30px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-left": {
      from: { opacity: 0, transform: "translateX(-30px)" },
      to: { opacity: 1, transform: "translateX(0)" },
    },
    "fade-right": {
      from: { opacity: 0, transform: "translateX(30px)" },
      to: { opacity: 1, transform: "translateX(0)" },
    },
    "tilt-in": {
      from: { opacity: 0, transform: "perspective(800px) rotateY(-6deg) translateX(-20px)" },
      to: { opacity: 1, transform: "perspective(800px) rotateY(0deg) translateX(0)" },
    },
    scale: {
      from: { opacity: 0, transform: "scale(0.85)" },
      to: { opacity: 1, transform: "scale(1)" },
    },
    "slide-right": {
      from: { opacity: 0, transform: "translateX(40px)" },
      to: { opacity: 1, transform: "translateX(0)" },
    },
  }

  const s = styles[animation]

  return (
    <div
      ref={ref}
      className={className}
      style={{
        willChange: "transform, opacity",
        ...(visible ? s.to : s.from),
        transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Animated counter (IntersectionObserver triggered)                   */
/* ------------------------------------------------------------------ */
function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Mouse-tracking tilt for hero post card                             */
/* ------------------------------------------------------------------ */
function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`
  }, [])

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0)"
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transition: "transform 0.2s ease-out", willChange: "transform" }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating particles (pure CSS, GPU composited)                      */
/* ------------------------------------------------------------------ */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary orb */}
      <div
        className="absolute top-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          animation: "lp-orb-drift-1 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Tertiary orb */}
      <div
        className="absolute bottom-[-15%] left-[-8%] w-[450px] h-[450px] rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, var(--color-tertiary) 0%, transparent 70%)",
          animation: "lp-orb-drift-2 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Small accent dots */}
      {[
        { top: "12%", left: "15%", size: 6, delay: 0, dur: 4 },
        { top: "25%", right: "20%", size: 4, delay: 1.5, dur: 5 },
        { top: "60%", left: "8%", size: 5, delay: 0.8, dur: 4.5 },
        { top: "45%", right: "12%", size: 3, delay: 2, dur: 3.5 },
        { top: "75%", left: "25%", size: 4, delay: 0.5, dur: 5.5 },
        { top: "80%", right: "30%", size: 5, delay: 1, dur: 4 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            top: dot.top,
            left: "left" in dot ? dot.left : undefined,
            right: "right" in dot ? dot.right : undefined,
            width: dot.size,
            height: dot.size,
            animation: `lp-float-slow ${dot.dur}s ease-in-out ${dot.delay}s infinite`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Feature card with hover lift + shimmer                             */
/* ------------------------------------------------------------------ */
interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  accentClass?: string
  children?: ReactNode
}

function FeatureCard({
  icon,
  title,
  description,
  accentClass = "bg-primary/10 text-primary",
  children,
}: FeatureCardProps) {
  return (
    <div className="lp-feature-card group relative bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 hover:border-primary/30 overflow-hidden">
      {/* Hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, color-mix(in srgb, var(--color-primary) 4%, transparent) 50%, transparent 60%)",
            animation: "lp-shimmer-line 2s ease-in-out infinite",
            willChange: "transform",
          }}
        />
      </div>

      <div
        className={`relative w-11 h-11 rounded-xl ${accentClass} flex items-center justify-center mb-4 transition-transform duration-400 group-hover:scale-110 group-hover:rotate-3`}
      >
        {icon}
      </div>
      <h3 className="relative font-geist font-semibold text-title-lg text-on-surface mb-2">
        {title}
      </h3>
      <p className="relative text-body-sm text-on-surface-variant font-inter leading-relaxed">
        {description}
      </p>
      {children && <div className="relative">{children}</div>}
    </div>
  )
}

/* ================================================================== */
/*  MAIN LANDING PAGE                                                  */
/* ================================================================== */
export function LandingPage() {
  const [headerBlurred, setHeaderBlurred] = useState(false)
  const [heroVoteCount, setHeroVoteCount] = useState(142)
  const [heroVoted, setHeroVoted] = useState(false)

  /* Header scroll listener */
  useEffect(() => {
    const onScroll = () => setHeaderBlurred(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Inject animation CSS once */
  useEffect(() => {
    const id = "lp-landing-styles"
    if (document.getElementById(id)) return
    const style = document.createElement("style")
    style.id = id
    style.textContent = LANDING_STYLES
    document.head.appendChild(style)
    return () => { document.getElementById(id)?.remove() }
  }, [])

  const handleHeroVote = () => {
    setHeroVoted((v) => !v)
    setHeroVoteCount((c) => (heroVoted ? c - 1 : c + 1))
  }

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* ──────────────────────────────────────────────────── */}
      {/*  HEADER                                              */}
      {/* ──────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${headerBlurred
            ? "bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-sm"
            : "bg-transparent border-b border-transparent"
          }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <FlaskConical size={18} className="text-on-primary" />
            </div>
            <span className="font-geist font-bold text-title-lg text-on-surface">
              Logos
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Communities", "Why Us"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(" ", "-")}`}
                className="relative text-title-sm text-on-surface-variant hover:text-on-surface font-geist transition-colors no-underline group/nav"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover/nav:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <div className="lp-cta-btn-glow rounded-lg text-white">
                <Button variant="primary" size="sm" className="text-white">
                  Get Started
                  <ArrowRight size={14} />
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────── */}
      {/*  HERO                                                */}
      {/* ──────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        <FloatingParticles />

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left column ── */}
            <div className="max-w-xl">
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/8 border border-primary/15 rounded-full mb-6 group cursor-default">
                  <Sparkles
                    size={14}
                    className="text-primary transition-transform duration-500 group-hover:rotate-90 group-hover:scale-125"
                  />
                  <span className="text-label-md font-geist font-medium text-primary">
                    Built for students, by students
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1
                  className="font-geist font-bold text-on-surface leading-[1.08] tracking-tight"
                  style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}
                >
                  Where Academic
                  <br />
                  <span
                    className="bg-clip-text text-transparent lp-gradient-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 40%, var(--color-tertiary-container) 70%, var(--color-primary) 100%)",
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Minds Connect
                  </span>
                  <span
                    className="inline-block w-[3px] h-[0.9em] bg-primary ml-1 align-text-bottom rounded-full"
                    style={{ animation: "lp-typing-cursor 1s step-end infinite" }}
                  />
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="mt-5 text-body-lg text-on-surface-variant font-inter leading-relaxed max-w-md">
                  The social platform built for campus life — native LaTeX rendering,
                  smart communities, collaborative quizzes, and a reputation
                  system that rewards real knowledge.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <Link to="/signup">
                    <div className="lp-cta-btn-glow rounded-lg">
                      <Button variant="primary" size="lg">
                        Join Logos
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </Link>
                  <Link to="/explore">
                    <Button variant="secondary" size="lg">
                      Explore Feed
                    </Button>
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="flex items-center gap-4 mt-8">
                  <div className="flex -space-x-2.5">
                    {["Aisha K.", "James L.", "Priya S.", "Marco R."].map(
                      (name, i) => (
                        <div
                          key={name}
                          style={{
                            animation: `lp-scale-bounce 0.5s cubic-bezier(.34,1.56,.64,1) ${400 + i * 80}ms both`,
                          }}
                        >
                          <Avatar
                            name={name}
                            size="sm"
                            className="ring-2 ring-surface"
                          />
                        </div>
                      )
                    )}
                    <div
                      className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-2 ring-surface text-label-sm font-geist font-bold"
                      style={{
                        animation: "lp-scale-bounce 0.5s cubic-bezier(.34,1.56,.64,1) 720ms both",
                      }}
                    >
                      +2k
                    </div>
                  </div>
                  <p className="text-body-sm text-on-surface-variant font-inter">
                    <span className="font-semibold text-on-surface">2,400+</span>{" "}
                    students already on campus
                  </p>
                </div>
              </Reveal>
            </div>

            {/* ── Right column — interactive post card ── */}
            <Reveal delay={200} animation="tilt-in" className="relative">
              {/* Glow behind card */}
              <div
                className="absolute -inset-6 rounded-3xl -z-10"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-tertiary))",
                  opacity: 0.06,
                  filter: "blur(40px)",
                  animation: "lp-card-glow 4s ease-in-out infinite",
                  willChange: "box-shadow",
                }}
              />

              {/* Floating side elements */}
              <div
                className="absolute -left-6 top-1/4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-3 py-2 shadow-lg hidden lg:flex items-center gap-2"
                style={{ animation: "lp-hero-badge-float 4s ease-in-out infinite", willChange: "transform" }}
              >
                <Bell size={14} className="text-primary" />
                <span className="text-label-sm font-geist font-medium text-on-surface">3 new replies</span>
              </div>

              <div
                className="absolute -right-4 bottom-1/4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-3 py-2 shadow-lg hidden lg:flex items-center gap-2"
                style={{ animation: "lp-hero-badge-float 5s ease-in-out 1s infinite", willChange: "transform" }}
              >
                <TrendingUp size={14} className="text-tertiary" />
                <span className="text-label-sm font-geist font-medium text-on-surface">+28 today</span>
              </div>

              <TiltCard className="lp-hero-post bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                {/* Post header */}
                <div className="flex items-center gap-3">
                  <Avatar name="Dr. Rivera" size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-geist font-semibold text-title-md text-on-surface">
                        Dr. Rivera
                      </span>
                      <Tag variant="department">PHYS-401</Tag>
                      <span className="inline-flex items-center gap-1 text-label-sm text-tertiary font-geist">
                        <Award size={12} /> Verified
                      </span>
                    </div>
                    <span className="text-body-sm text-on-surface-variant font-inter">
                      @physics_dept · 2h ago
                    </span>
                  </div>
                  <button className="text-on-surface-variant/40 hover:text-tertiary transition-colors">
                    <Star size={16} />
                  </button>
                </div>

                {/* Post body */}
                <p className="mt-4 text-body-md text-on-surface font-inter leading-relaxed">
                  Fascinating derivation for the quantum harmonic oscillator
                  ground state today. Notice how the uncertainty principle
                  naturally arises:
                </p>

                {/* LaTeX block with subtle shimmer */}
                <div className="relative mt-3 bg-surface-container/60 border border-outline-variant/10 rounded-xl p-4 overflow-hidden">
                  <div className="space-y-2.5">
                    <p className="font-mono text-sm text-primary font-medium">
                      {"$$\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}$$"}
                    </p>
                    <p className="font-mono text-sm text-on-surface-variant">
                      {"$$\\psi_0(x) = \\left(\\frac{m\\omega}{\\pi\\hbar}\\right)^{1/4} e^{-\\frac{m\\omega x^2}{2\\hbar}}$$"}
                    </p>
                  </div>
                  {/* Subtle left accent */}
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary/40" />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Tag variant="trending">#QuantumMechanics</Tag>
                  <Tag variant="trending">#Physics</Tag>
                  <Tag variant="trending">#Derivation</Tag>
                </div>

                {/* Interactive action bar */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={handleHeroVote}
                      className={`flex items-center gap-1.5 font-geist text-label-md font-medium transition-all duration-200 ${heroVoted ? "text-tertiary scale-110" : "text-on-surface-variant hover:text-tertiary"
                        }`}
                      style={{ transition: "color 0.2s, transform 0.3s cubic-bezier(.34,1.56,.64,1)" }}
                    >
                      <ChevronUp size={18} className="relative -top-px" />
                      <span>{heroVoteCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-on-surface-variant font-geist text-label-md transition-colors hover:text-on-surface">
                      <MessageSquare size={16} />
                      <span>38</span>
                    </button>
                  </div>
                  <span className="text-label-sm text-on-surface-variant/60 font-inter flex items-center gap-1">
                    <TrendingUp size={12} />
                    Trending in Physics
                  </span>
                </div>
              </TiltCard>

              {/* Floating trending badge */}
              <div
                className="absolute -top-3 -right-3 bg-tertiary text-on-tertiary px-3 py-1.5 rounded-full text-label-sm font-geist font-semibold shadow-lg"
                style={{ animation: "lp-hero-badge-float 3s ease-in-out infinite", willChange: "transform" }}
              >
                🔥 Trending
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── */}
      {/*  FEATURES GRID                                       */}
      {/* ──────────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-label-md font-geist font-semibold text-primary tracking-wider uppercase mb-3">
              Features
            </span>
            <h2 className="font-geist font-bold text-display-lg text-on-surface">
              Everything your campus needs
            </h2>
            <p className="mt-3 text-body-lg text-on-surface-variant font-inter max-w-xl mx-auto">
              From rigorous academic discourse to casual campus buzz — every tool
              students actually need, built in.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              {
                icon: <Sigma size={20} />,
                title: "Native LaTeX & Rich Text",
                description:
                  "Write equations, code blocks, and formatted text natively. No more screenshots of handwritten notes.",
                accent: "bg-primary/10 text-primary",
                extra: (
                  <div className="mt-4 bg-surface-container/50 rounded-lg p-3 text-xs font-mono text-primary/80 border border-outline-variant/10 overflow-hidden relative">
                    <span>{"∫₀^∞ e^{-x²} dx = √π / 2"}</span>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                      style={{ animation: "lp-shimmer-line 3s ease-in-out infinite", willChange: "transform" }}
                    />
                  </div>
                ),
                delay: 0,
              },
              {
                icon: <Users size={20} />,
                title: "Smart Communities",
                description:
                  "Create or join communities for your courses, departments, or interest groups. Share resources, organize study sessions.",
                accent: "bg-secondary/10 text-secondary",
                extra: (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Tag variant="department">CS-301</Tag>
                    <Tag variant="department">BIO-L3</Tag>
                    <Tag variant="skill">Study Group</Tag>
                  </div>
                ),
                delay: 80,
              },
              {
                icon: <Brain size={20} />,
                title: "Collaborative Quizzes",
                description:
                  "Create and take quizzes within study groups. Test your knowledge, track progress, and compete with peers.",
                accent: "bg-tertiary/10 text-tertiary",
                extra: (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex -space-x-1.5">
                      {["A", "B", "C"].map((n) => (
                        <div
                          key={n}
                          className="w-6 h-6 rounded-full bg-surface-container-high text-label-sm font-geist font-semibold text-on-surface-variant flex items-center justify-center ring-2 ring-surface-container-lowest"
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                    <span className="text-label-sm text-on-surface-variant font-inter">
                      12 taking now
                    </span>
                  </div>
                ),
                delay: 160,
              },
              {
                icon: <ArrowUpDown size={20} />,
                title: "Reputation & Voting",
                description:
                  "Upvote quality answers, build your academic reputation. The best content rises to the top.",
                accent: "bg-tertiary/10 text-tertiary",
                extra: (
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-1 text-tertiary text-label-md font-geist font-semibold">
                      <ChevronUp size={16} />
                      <span>1,247</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "72%",
                          background: "linear-gradient(90deg, var(--color-primary), var(--color-tertiary))",
                        }}
                      />
                    </div>
                  </div>
                ),
                delay: 200,
              },
              {
                icon: <Smartphone size={20} />,
                title: "Install Anywhere (PWA)",
                description:
                  "Install directly from your browser — iOS, Android, Windows, Linux. Works offline with smart sync.",
                accent: "bg-primary/10 text-primary",
                extra: (
                  <div className="flex items-center gap-3 mt-4 text-label-sm font-inter">
                    <span className="flex items-center gap-1 text-green-600">
                      <Wifi size={12} /> Online
                    </span>
                    <span className="text-outline-variant">→</span>
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <WifiOff size={12} /> Offline ready
                    </span>
                  </div>
                ),
                delay: 260,
              },
              {
                icon: <Shield size={20} />,
                title: "Moderation & Trust",
                description:
                  "University-verified badges, community moderators, and a reporting system that keeps discourse civil.",
                accent: "bg-error/10 text-error",
                extra: (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center gap-1 text-label-sm font-geist text-tertiary">
                      <Award size={12} />
                      <span>.edu verified</span>
                    </div>
                    <span className="text-outline-variant/40">·</span>
                    <span className="text-label-sm font-inter text-on-surface-variant">
                      24/7 moderation
                    </span>
                  </div>
                ),
                delay: 320,
              },
            ] as const).map((f) => (
              <Reveal key={f.title} delay={f.delay} animation="scale">
                <FeatureCard
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  accentClass={f.accent}
                >
                  {f.extra}
                </FeatureCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── */}
      {/*  COMMUNITIES SHOWCASE                                */}
      {/* ──────────────────────────────────────────────────── */}
      <section id="communities" className="py-20 lg:py-28 bg-surface-container-low/40">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal animation="fade-left">
              <span className="inline-block text-label-md font-geist font-semibold text-primary tracking-wider uppercase mb-3">
                Communities
              </span>
              <h2 className="font-geist font-bold text-display-md text-on-surface">
                Your department.
                <br />
                Your study group.
                <br />
                <span
                  className="bg-clip-text text-transparent lp-gradient-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-tertiary-container) 100%)",
                    backgroundSize: "200% 200%",
                  }}
                >
                  Your community.
                </span>
              </h2>
              <p className="mt-4 text-body-lg text-on-surface-variant font-inter leading-relaxed max-w-md">
                Create private or public communities for any course, club, or
                interest. Organize members into groups, run quizzes, and curate a
                focused knowledge base.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/signup">
                  <div className="lp-cta-btn-glow rounded-lg">
                    <Button variant="primary" size="md">
                      Create a Community
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </Link>
              </div>
            </Reveal>

            <div className="space-y-4">
              {[
                { name: "Machine Learning Lab", tag: "CS-401", members: 234, icon: Brain, active: true, posts: 18 },
                { name: "Organic Chemistry II", tag: "CHEM-302", members: 167, icon: FlaskConical, active: false, posts: 12 },
                { name: "Student Entrepreneurs", tag: "BUSINESS", members: 412, icon: GraduationCap, active: false, posts: 24 },
              ].map((c, i) => (
                <Reveal key={c.name} delay={i * 120} animation="slide-right">
                  <div
                    className={`lp-community-card flex items-center gap-4 p-4 rounded-2xl border cursor-default ${c.active
                        ? "bg-surface-container-lowest border-primary/25 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
                        : "bg-surface-container-lowest/60 border-outline-variant/15 hover:border-outline-variant/30"
                      }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${c.active
                          ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                          : "bg-surface-container text-on-surface-variant"
                        }`}
                    >
                      <c.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-geist font-semibold text-title-md text-on-surface truncate">
                          {c.name}
                        </span>
                        <Tag variant="department">{c.tag}</Tag>
                      </div>
                      <span className="text-body-sm text-on-surface-variant font-inter">
                        {c.members} members · {c.posts} posts today
                      </span>
                    </div>
                    {c.active && (
                      <div className="relative shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <div
                          className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500"
                          style={{ animation: "lp-pulse-ring 2s ease-out infinite" }}
                        />
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── */}
      {/*  STATS                                               */}
      {/* ──────────────────────────────────────────────────── */}
      <section id="why-us" className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-label-md font-geist font-semibold text-primary tracking-wider uppercase mb-3">
              Growing Every Day
            </span>
            <h2 className="font-geist font-bold text-display-md text-on-surface">
              Trusted by students across campus
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { value: 2400, suffix: "+", label: "Active Students", icon: <GraduationCap size={20} /> },
              { value: 180, suffix: "+", label: "Communities", icon: <Users size={20} /> },
              { value: 12000, suffix: "+", label: "Posts Shared", icon: <BookOpen size={20} /> },
              { value: 850, suffix: "+", label: "Quizzes Created", icon: <Brain size={20} /> },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100} animation="scale">
                <div className="lp-stat-card text-center p-6 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl">
                  <div className="lp-stat-icon w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center mx-auto mb-3">
                    {stat.icon}
                  </div>
                  <div
                    className="font-geist font-bold text-display-md text-on-surface"
                    style={{ animation: "lp-number-glow 3s ease-in-out infinite" }}
                  >
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-body-sm text-on-surface-variant font-inter mt-1">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── */}
      {/*  BOTTOM CTA                                          */}
      {/* ──────────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Animated gradient accent */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, var(--color-primary), transparent)",
            opacity: 0.04,
            animation: "lp-gradient-shift 8s ease infinite",
            backgroundSize: "200% 200%",
          }}
        />

        <Reveal className="mx-auto max-w-3xl px-4 lg:px-8 text-center" animation="scale">
          <div
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 relative"
          >
            <FlaskConical size={26} className="text-on-primary" />
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-2xl bg-primary"
              style={{ animation: "lp-pulse-ring 2.5s ease-out infinite" }}
            />
          </div>
          <h2 className="font-geist font-bold text-display-lg text-on-surface">
            Ready to join the conversation?
          </h2>
          <p className="mt-4 text-body-lg text-on-surface-variant font-inter max-w-md mx-auto leading-relaxed">
            Sign up with your university email and start connecting with
            classmates, professors, and study groups today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/signup">
              <div className="lp-cta-btn-glow rounded-lg">
                <Button variant="primary" size="lg">
                  Create Your Account
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                I Already Have an Account
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-body-sm text-on-surface-variant/50 font-inter">
            Free forever · No credit card required · .edu verification for badges
          </p>
        </Reveal>
      </section>

      <Footer />
    </div>
  )
}
