"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Copy, Check, Star, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Framework data for the cycling animation
const FRAMEWORKS = [
  {
    name: "Spec Kit",
    command: "npx spec-kit init",
    stars: 1200,
    description: "Spec-driven development for AI coding agents",
    color: "#22d3ee",
  },
  {
    name: "BMAD Method",
    command: "npx bmad-method init",
    stars: 890,
    description: "Breakthrough Method of Agile AI-Driven Development",
    color: "#a78bfa",
  },
  {
    name: "Cline Memory Bank",
    command: "npx @anthropic/cline-memory init",
    stars: 756,
    description: "Persistent context and memory for Cline agents",
    color: "#34d399",
  },
  {
    name: "Roo Code",
    command: "npx roo-code init",
    stars: 623,
    description: "Boomerang task orchestration with subagents",
    color: "#fbbf24",
  },
];

// Typewriter hook
function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(false);
    setIsDone(false);

    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          setIsDone(true);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isTyping, isDone };
}

export function LivingCommandHome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentFramework = FRAMEWORKS[currentIndex];
  const { displayedText, isTyping, isDone } = useTypewriter(
    currentFramework.command,
    45,
    isTransitioning ? 400 : 0
  );

  // Cycle through frameworks
  useEffect(() => {
    if (!isDone) return;

    const timeout = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % FRAMEWORKS.length);
        setIsTransitioning(false);
      }, 300);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isDone]);

  const copyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentFramework.command);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste in your terminal to install",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [currentFramework.command]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${currentFramework.color}15, transparent)`,
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Minimal header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            <span className="font-semibold tracking-tight">augs.dev</span>
          </div>
          <Link
            href="/frameworks"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Browse all
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-16">
        {/* Terminal container */}
        <div className="w-full max-w-2xl">
          {/* Terminal window */}
          <div
            onClick={copyCommand}
            className={cn(
              "group relative rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm",
              "cursor-pointer transition-all duration-300",
              "hover:border-zinc-700 hover:bg-zinc-900/80",
              "hover:shadow-2xl hover:shadow-cyan-500/5",
              "active:scale-[0.995]"
            )}
          >
            {/* Terminal header dots */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-600 font-mono">terminal</span>
            </div>

            {/* Terminal content */}
            <div className="px-6 py-8">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-mono text-lg select-none">$</span>
                <code
                  className={cn(
                    "font-mono text-xl md:text-2xl transition-opacity duration-300",
                    isTransitioning && "opacity-0"
                  )}
                  style={{ color: currentFramework.color }}
                >
                  {displayedText}
                </code>
                {/* Cursor */}
                <span
                  className={cn(
                    "w-3 h-7 bg-current transition-opacity",
                    isTyping ? "animate-pulse" : "opacity-0"
                  )}
                  style={{ color: currentFramework.color }}
                />
              </div>
            </div>

            {/* Copy indicator - appears on hover */}
            <div className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 mt-4",
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-zinc-800/80 border border-zinc-700",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              copied && "opacity-100"
            )}>
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-zinc-400" />
                  <span className="text-xs text-zinc-400">Click to copy</span>
                </>
              )}
            </div>
          </div>

          {/* Framework info */}
          <div
            className={cn(
              "mt-6 text-center transition-all duration-300",
              isTransitioning && "opacity-0 translate-y-2"
            )}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{currentFramework.name}</h2>
              <div className="flex items-center gap-1 text-amber-400/80 text-sm">
                <Star size={14} className="fill-current" />
                <span>{currentFramework.stars >= 1000 ? `${(currentFramework.stars / 1000).toFixed(1)}k` : currentFramework.stars}</span>
              </div>
            </div>
            <p className="text-zinc-400">{currentFramework.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {FRAMEWORKS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(idx);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "bg-cyan-400 w-6"
                    : "bg-zinc-700 hover:bg-zinc-600"
                )}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <span><span className="text-zinc-300 font-medium">12</span> frameworks</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span><span className="text-zinc-300 font-medium">156</span> skills</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Claude · Cursor · Windsurf</span>
          </div>

          {/* CTA */}
          <Link
            href="/frameworks"
            className={cn(
              "group flex items-center gap-2 px-6 py-3 rounded-xl",
              "bg-zinc-900 border border-zinc-800",
              "hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200"
            )}
          >
            <span className="text-sm font-medium">Explore all frameworks</span>
            <ArrowRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
