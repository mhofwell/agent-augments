"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, Cpu, Palette, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFrameworks } from "@/hooks/useFrameworks";
import { useSkillPublishers } from "@/hooks/useSkillPublishers";
import { useComponentLibraries } from "@/hooks/useComponentLibraries";

// Framework installation sequences
const FRAMEWORKS = [
  {
    name: "Spec Kit",
    command: "npx spec-kit init",
    color: "#22d3ee",
    sequence: [
      { type: "command", text: "$ npx spec-kit init", delay: 0 },
      { type: "status", text: "", delay: 800 },
      { type: "header", text: "Adding skills...", delay: 1000 },
      { type: "item", text: "├── /start", delay: 1200 },
      { type: "item", text: "├── /build", delay: 1350 },
      { type: "item", text: "└── /review", delay: 1500 },
      { type: "status", text: "", delay: 1700 },
      { type: "header", text: "Adding agents...", delay: 1900 },
      { type: "item", text: "├── spec-writer", delay: 2100 },
      { type: "item", text: "└── code-builder", delay: 2250 },
      { type: "status", text: "", delay: 2500 },
      { type: "header", text: "Creating config...", delay: 2700 },
      { type: "code", text: "├── CLAUDE.md", delay: 2900 },
      { type: "code", text: "└── .cursorrules", delay: 3050 },
      { type: "status", text: "", delay: 3300 },
      { type: "success", text: "✓ Ready to ship!", delay: 3500 },
    ],
  },
  {
    name: "BMAD Method",
    command: "npx bmad-method init",
    color: "#a78bfa",
    sequence: [
      { type: "command", text: "$ npx bmad-method init", delay: 0 },
      { type: "status", text: "", delay: 800 },
      { type: "header", text: "Adding agents...", delay: 1000 },
      { type: "item", text: "├── orchestrator", delay: 1200 },
      { type: "item", text: "├── analyst", delay: 1350 },
      { type: "item", text: "├── developer", delay: 1500 },
      { type: "item", text: "└── reviewer", delay: 1650 },
      { type: "status", text: "", delay: 1900 },
      { type: "header", text: "Adding skills...", delay: 2100 },
      { type: "item", text: "├── /plan", delay: 2300 },
      { type: "item", text: "├── /execute", delay: 2450 },
      { type: "item", text: "└── /iterate", delay: 2600 },
      { type: "status", text: "", delay: 2850 },
      { type: "header", text: "Setting methodology...", delay: 3050 },
      { type: "code", text: "└── autonomy: HIGH", delay: 3250 },
      { type: "status", text: "", delay: 3500 },
      { type: "success", text: "✓ Agile AI ready!", delay: 3700 },
    ],
  },
  {
    name: "Claude Flow",
    command: "npx claude-flow init",
    color: "#34d399",
    sequence: [
      { type: "command", text: "$ npx claude-flow init", delay: 0 },
      { type: "status", text: "", delay: 800 },
      { type: "header", text: "Adding MCP servers...", delay: 1000 },
      { type: "json", text: '├── { "server": "filesystem" }', delay: 1200 },
      { type: "json", text: '├── { "server": "github" }', delay: 1400 },
      { type: "json", text: '└── { "server": "memory" }', delay: 1600 },
      { type: "status", text: "", delay: 1900 },
      { type: "header", text: "Adding subagents...", delay: 2100 },
      { type: "item", text: "├── task-decomposer", delay: 2300 },
      { type: "item", text: "├── parallel-executor", delay: 2450 },
      { type: "item", text: "└── result-aggregator", delay: 2600 },
      { type: "status", text: "", delay: 2850 },
      { type: "header", text: "Configuring orchestration...", delay: 3050 },
      { type: "code", text: "└── mode: agentic-mesh", delay: 3250 },
      { type: "status", text: "", delay: 3500 },
      { type: "success", text: "✓ Flow initialized!", delay: 3700 },
    ],
  },
];

interface TerminalLine {
  type: string;
  text: string;
  visible: boolean;
}

const MAX_VISIBLE_LINES = 10;

function InstallTerminal({
  framework,
  isActive,
  onComplete
}: {
  framework: typeof FRAMEWORKS[0];
  isActive: boolean;
  onComplete: () => void;
}) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [commandText, setCommandText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Reset and start animation when framework changes
  useEffect(() => {
    if (!isActive) return;

    setLines([]);
    setCommandText("");
    setIsTyping(true);

    // Type the command first
    const command = framework.sequence[0].text;
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < command.length) {
        setCommandText(command.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);

        // Then reveal the rest of the sequence
        framework.sequence.slice(1).forEach((line, index) => {
          setTimeout(() => {
            setLines(prev => {
              const newLines = [...prev, { ...line, visible: true }];
              return newLines;
            });

            // Check if this is the last line
            if (index === framework.sequence.length - 2) {
              setTimeout(onComplete, 2000);
            }
          }, line.delay);
        });
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [framework, isActive, onComplete]);

  // Auto-scroll to bottom when new lines appear
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (type: string) => {
    switch (type) {
      case "command": return framework.color;
      case "header": return "#a1a1aa"; // zinc-400
      case "item": return "#22d3ee"; // cyan
      case "code": return "#fbbf24"; // amber
      case "json": return "#a78bfa"; // violet
      case "success": return "#34d399"; // emerald
      default: return "#71717a"; // zinc-500
    }
  };

  return (
    <div
      ref={terminalRef}
      className="font-mono text-sm leading-relaxed h-[260px] overflow-hidden relative"
    >
      {/* Fade out gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-zinc-950 to-transparent z-10 pointer-events-none" />

      <div className="pt-6">
        {/* Command line with typing */}
        <div className="flex items-center">
          <span style={{ color: framework.color }}>{commandText}</span>
          {isTyping && (
            <span
              className="w-2 h-5 ml-0.5 animate-pulse"
              style={{ backgroundColor: framework.color }}
            />
          )}
        </div>

        {/* Rest of the sequence */}
        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              "transition-all duration-300",
              line.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
            )}
            style={{ color: getLineColor(line.type) }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstallCinemaHome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentFramework = FRAMEWORKS[currentIndex];

  // Fetch real data for the sections
  const { frameworks, isLoading: frameworksLoading } = useFrameworks();
  const { publishers, isLoading: publishersLoading } = useSkillPublishers({ includeSkills: true });
  const { libraries: componentLibraries, isLoading: componentsLoading } = useComponentLibraries();

  // Calculate totals
  const totalSkills = publishers.reduce((acc, p) => acc + (p.skills?.length || 0), 0);

  const handleSequenceComplete = useCallback(() => {
    // Move to next framework
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % FRAMEWORKS.length);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 10%, ${currentFramework.color}08, transparent)`,
        }}
      />

      {/* Header - matches rest of site */}
      <header className="relative z-10 px-6 py-4 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <img
                src="/agent-augments-ascii-transparent.svg"
                alt="Agent Augments"
                className="h-8 w-auto opacity-90"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
                Frameworks
              </Link>
              <Link href="/skills" className="text-zinc-400 hover:text-white transition-colors">
                Skills
              </Link>
              <Link href="/components" className="text-zinc-400 hover:text-white transition-colors">
                Components
              </Link>
            </nav>
          </div>
          <a
            href="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-8 md:pt-16">
        <div className="w-full max-w-5xl mx-auto">

          {/* Two-column layout: Logo + Terminal */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">

            {/* Left: Logo + CTA */}
            <div className="flex flex-col items-center md:items-start">
              <img
                src="/agent-augments-ascii-transparent.svg"
                alt="Agent Augments"
                className="h-36 md:h-48 w-auto opacity-95 mb-6"
              />
              <p className="text-zinc-400 text-base md:text-lg max-w-sm text-center md:text-left mb-8">
                Complete agent frameworks built from skills, MCPs, subagents, workflows, and rules.
              </p>

              {/* CTA Button */}
              <Link
                href="/"
                className={cn(
                  "group inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold",
                  "hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200",
                  "shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                )}
              >
                Browse augments
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Right: Terminal */}
            <div className="relative">
              {/* Terminal chrome */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-3 text-xs text-zinc-500 font-mono">
                    ~/projects/my-app
                  </span>
                </div>

                {/* Terminal content - fixed height */}
                <div className="px-5 py-4">
                  <InstallTerminal
                    framework={currentFramework}
                    isActive={isPlaying}
                    onComplete={handleSequenceComplete}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Category Sections */}
      <section className="relative z-10 px-6 py-20 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Frameworks Card */}
            <Link
              href="/"
              className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Boxes size={20} className="text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold">Frameworks</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Complete development methodologies with agents, skills, and workflows.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {frameworksLoading ? "..." : `${frameworks.length} frameworks`}
                </span>
                <ArrowRight size={16} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              {/* Top frameworks preview */}
              {!frameworksLoading && frameworks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex flex-wrap gap-2">
                    {frameworks.slice(0, 3).map((f) => (
                      <span key={f.id} className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400">
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Link>

            {/* Skills Card */}
            <Link
              href="/skills"
              className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Cpu size={20} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold">Skills</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Official skills from Anthropic, Vercel, Stripe, and other trusted publishers.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {publishersLoading ? "..." : `${publishers.length} publishers · ${totalSkills} skills`}
                </span>
                <ArrowRight size={16} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              {/* Publisher logos preview */}
              {!publishersLoading && publishers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3">
                    {publishers.slice(0, 4).map((p) => (
                      <div key={p.id} className="relative group/logo">
                        {p.logo_url ? (
                          <img
                            src={p.logo_url}
                            alt={p.name}
                            className="w-6 h-6 rounded object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {publishers.length > 4 && (
                      <span className="text-xs text-zinc-600">+{publishers.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </Link>

            {/* Components Card */}
            <Link
              href="/components"
              className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Palette size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold">Components</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Component libraries with official MCP servers for AI-powered development.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {componentsLoading ? "..." : `${componentLibraries.length} libraries`}
                </span>
                <ArrowRight size={16} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              {/* Component libraries preview */}
              {!componentsLoading && componentLibraries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3">
                    {componentLibraries.slice(0, 4).map((lib) => (
                      <div key={lib.id} className="relative">
                        {lib.logo_url ? (
                          <img
                            src={lib.logo_url}
                            alt={lib.name}
                            className="w-6 h-6 rounded object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                            {lib.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {componentLibraries.length > 4 && (
                      <span className="text-xs text-zinc-600">+{componentLibraries.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>Works with Claude Code, Cursor, Windsurf</span>
          </div>
          <div className="flex items-center gap-6">
            <span>
              {frameworksLoading ? "..." : <><span className="text-zinc-300">{frameworks.length}</span> frameworks</>}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>
              {publishersLoading ? "..." : <><span className="text-zinc-300">{totalSkills}</span> skills</>}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>
              {componentsLoading ? "..." : <><span className="text-zinc-300">{componentLibraries.length}</span> component libraries</>}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
