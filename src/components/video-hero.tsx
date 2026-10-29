"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, Pause, Sparkles, Compass } from "lucide-react";

export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleScrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("features") || document.getElementById("curated-atmospheres");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0c0914] text-white">
      {/* Cinematic Video Background Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover scale-105 transition-opacity duration-1000 ${
            videoLoaded ? "opacity-45" : "opacity-30"
          }`}
        >
          {/* High-quality royalty-free luxury celebration video snippet */}
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-candles-and-decorations-at-an-outdoor-wedding-43224-large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Deep Midnight Plum, Charcoal & Burgundy Atmospheric Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0914] via-[#0C0914]/65 to-[#0C0914]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0C0914_90%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#170E20]/80 via-transparent to-[#1F1124]/80" />
      </div>

      {/* Floating Video Play/Pause Control Button */}
      <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs font-medium flex items-center gap-2 transition-all hover:bg-black/60 shadow-sm"
          title={isPlaying ? "Pause cinematic background" : "Play cinematic background"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? "Pause Scene" : "Play Scene"}</span>
        </button>
      </div>

      {/* Central Editorial Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center space-y-8">
        {/* Subtle Luxury Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-950/20 text-amber-300 text-xs font-semibold tracking-widest uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>The Celebration Copilot</span>
        </div>

        {/* Editorial Serif Headline */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.06] text-balance">
          Make every moment <br />
          <span className="italic font-normal bg-gradient-to-r from-rose-200 via-amber-200 to-rose-300 bg-clip-text text-transparent">
            extraordinary.
          </span>
        </h1>

        {/* Supporting Editorial Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
          Plan weddings, birthdays, anniversaries and gatherings with one intelligent AI copilot.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/wizard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e07a8b] via-[#ef7187] to-[#e0a96d] text-white font-bold text-sm sm:text-base shadow-elevated hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Start Planning</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#features"
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>See How It Works</span>
          </a>
        </div>
      </div>
    </section>
  );
}
