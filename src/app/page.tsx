"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useApp } from "@/contexts/app-context";
import { VideoHero } from "@/components/video-hero";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Coins,
  TrendingDown,
  ChevronRight,
  Camera,
  Palette,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { loadDemoEvent } = useApp();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Editorial Luxury Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                UtsavAI
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-sans uppercase tracking-widest text-muted-foreground font-semibold">
                The Celebration Copilot
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="#atmospheres" className="hover:text-foreground transition-colors">
              Atmospheres
            </Link>
            <Link href="#reality-check" className="hover:text-foreground transition-colors">
              Budget Reality Check
            </Link>
            <Link href="#occasions" className="hover:text-foreground transition-colors">
              Celebrations
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => {
                loadDemoEvent();
                router.push("/dashboard");
              }}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              Load Demo Event
            </button>
            <Link
              href="/wizard"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg gradient-cta text-white shadow-sm hover:opacity-95 hover:shadow-glow transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Cinematic Video Hero ── */}
      <VideoHero />

      {/* ── Editorial Visual Showcase: Curated Celebration Atmospheres ── */}
      <section
        id="atmospheres"
        className="py-20 bg-background border-t border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase">
                <Palette className="w-3.5 h-3.5" />
                <span>Visual Inspiration & Styling</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Aesthetic Atmospheres, <br />
                <span className="italic font-normal bg-gradient-to-r from-primary via-coral to-secondary bg-clip-text text-transparent">
                  thoughtfully curated.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                From royal heritage mandaps drenched in marigolds to candlelit banquet minimalism, UtsavAI adapts styling guidelines, vendor quotas, and color palettes to your celebration aesthetic.
              </p>
            </div>

            <Link
              href="/inspiration"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start md:self-end"
            >
              <Camera className="w-4 h-4" />
              <span>Explore Inspiration Gallery</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Royal Heritage & Marigold Grandeur",
                category: "Weddings & Sangeet",
                palette: ["#d97706", "#dc2626", "#fef08a", "#78350f"],
                tag: "Opulent & Traditional",
                image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
                description: "Brass urns, cascading tuberose and marigold drapes, royal velvet seating, and golden ambient uplighting.",
                occasion: "wedding",
              },
              {
                title: "Midnight Gala & Candlelit Banquet",
                category: "Receptions & Anniversaries",
                palette: ["#1e1b4b", "#fbcfe8", "#fbbf24", "#312e81"],
                tag: "Contemporary Luxury",
                image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
                description: "Crystal chandeliers, long family-style banquet tables, blush botanical runners, and warm candlelight.",
                occasion: "anniversary",
              },
              {
                title: "Sunlit Botanical & Intimate Soirée",
                category: "Birthdays & Gatherings",
                palette: ["#15803d", "#fef3c7", "#f472b6", "#047857"],
                tag: "Fresh & Breezy",
                image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
                description: "Open-air lawn lounge, fairy-light canopies, artisanal dessert bars, and customized acoustic entertainment.",
                occasion: "birthday",
              },
            ].map((vibe, idx) => (
              <div
                key={idx}
                className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col"
              >
                {/* Visual Header with Real Luxury Celebration Photography */}
                <div className="relative h-64 overflow-hidden bg-muted">
                  <img
                    src={vibe.image}
                    alt={vibe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium tracking-wide">
                      {vibe.tag}
                    </span>
                  </div>

                  {/* Palette Swatches */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
                    {vibe.palette.map((color, cIdx) => (
                      <span
                        key={cIdx}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  <span className="absolute bottom-4 right-4 text-[11px] font-semibold text-white/90">
                    {vibe.category}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {vibe.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {vibe.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <Link
                      href={`/wizard?occasion=${vibe.occasion}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Plan With This Aesthetic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Luxury Feature Panels ── */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Coins className="w-6 h-6" />,
                color: "bg-secondary/15 text-secondary",
                title: "Budget, beautifully balanced",
                desc: "Mathematical certainty with live overrun alerts, vendor payment sync, and rupee-accurate category breakdowns.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                color: "bg-primary/10 text-primary",
                title: "Ideas inspired by your photos",
                desc: "Upload inspiration images to IndexedDB. AI extracts your color palette and suggests matching themes and décor.",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                color: "bg-sage/20 text-sage",
                title: "A plan that adapts to you",
                desc: "Phase-based task timelines that shift automatically as your milestone date approaches.",
              },
            ].map((panel, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated transition-all duration-300 space-y-4 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${panel.color} group-hover:scale-110 transition-transform`}
                >
                  {panel.icon}
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {panel.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {panel.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Occasions Showcase Section ── */}
      <section id="occasions" className="py-20 border-y border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              What Are We Celebrating?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Every Occasion, Beautifully Planned
            </h2>
            <p className="text-sm text-muted-foreground">
              Whether intimate dinner or 500-guest gala, UtsavAI adapts budget formulas and timelines to your exact celebration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Weddings",
                tagline: "Elegant, memorable and perfectly organized",
                icon: "💍",
                slug: "wedding",
                features: ["Sangeet & reception timelines", "Multi-vendor quote tracking", "Seating & dietary plans"],
              },
              {
                title: "Birthdays",
                tagline: "Fun ideas for every age and milestone",
                icon: "🎂",
                slug: "birthday",
                features: ["Custom cake & dessert bars", "Activity & game schedules", "Return gift logistics"],
              },
              {
                title: "Anniversaries",
                tagline: "Celebrate love beautifully with loved ones",
                icon: "💑",
                slug: "anniversary",
                features: ["Memory walls & slide decks", "Romantic ambient styling", "Intimate catering menus"],
              },
              {
                title: "Community Events",
                tagline: "Plan larger gatherings with ease & clarity",
                icon: "🎊",
                slug: "community",
                features: ["Per-head cost breakdown", "Stage & sound checklists", "Volunteer task delegations"],
              },
            ].map((occ, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted/70 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                    {occ.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">{occ.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{occ.tagline}</p>
                  </div>
                  <ul className="space-y-1.5 pt-2">
                    {occ.features.map((f, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6">
                  <Link
                    href={`/wizard?occasion=${occ.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
                  >
                    <span>Plan {occ.title}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Budget Reality Check Spotlight ── */}
      <section id="reality-check" className="py-20 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 shadow-elevated">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>The Standout Differentiator</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  Budget Reality Check™
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Unlike generic planners that only log numbers, UtsavAI continuously monitors your quotes and invoices against your initial budget. The moment planned expenses exceed your target, it pinpoints the exact overrun and proposes <strong>actionable, reviewable alternatives</strong> with real-time recalculations.
                </p>

                <div className="space-y-2.5 text-xs text-foreground">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Exact rupee-for-rupee arithmetic calculated in application code, never hallucinated.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>One-click savings applications: preview the impact before applying adjustments.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Clear distinction between initial quotes, estimates, and actual disbursements.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      loadDemoEvent();
                      router.push("/budget");
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-cta text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                  >
                    <span>Test Reality Check Live</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Visual Preview Box */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-red-500/30 bg-card p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                        !
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">You are over budget by ₹3,500</p>
                        <p className="text-[11px] text-muted-foreground">
                          Planned: ₹28,500 • Target Budget: ₹25,000
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-500">+14% Over</span>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    AI Suggestions to Reduce Cost:
                  </p>

                  <div className="space-y-2">
                    {[
                      { text: "Opt for a simpler decoration package", save: "₹1,500" },
                      { text: "Choose a more economical menu", save: "₹1,000" },
                      { text: "Reduce entertainment expenses", save: "₹800" },
                      { text: "Consider tailored photography hours", save: "₹1,200" },
                    ].map((sug, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 text-xs"
                      >
                        <span className="text-muted-foreground">{sug.text}</span>
                        <span className="font-bold text-sage">- Save {sug.save}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        loadDemoEvent();
                        router.push("/budget");
                      }}
                      className="w-full py-2 rounded-xl gradient-cta text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <span>Open Budget Reality Check</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid: Core Capabilities ── */}
      <section id="features" className="py-20 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Core Capabilities
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need in One Copilot
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Personalized AI Plans</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Structured themes, curated color palettes, suggested schedules and menu ideas built around your location and guest preferences.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Smart Budget Management</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mathematical certainty with automatic category breakdowns, contingency reserves, and instant recalculations.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-sage/20 text-sage flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Timelines & Checklists</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Phase-based tasks that adapt to your remaining days. Complete milestones with celebratory feedback.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Vendor Guidance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Side-by-side quote comparisons, payment statuses, and preferred vendor selections with zero vendor bias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Transparency Note ── */}
      <section className="py-12 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-semibold uppercase tracking-wider">Estimate Transparency Guarantee</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All AI-generated prices are intelligent market estimates based on your event location and guest count. Once you receive confirmed quotes from actual vendors, UtsavAI immediately updates your mathematical balance to reflect real-world commitments.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border bg-card/60 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-foreground">UtsavAI</span>
            <span>— Every celebration, beautifully planned.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/wizard" className="hover:text-foreground transition-colors">
              Plan Event
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/inspiration" className="hover:text-foreground transition-colors">
              Inspiration
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
