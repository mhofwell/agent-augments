"use client";

import { useState } from "react";

const AGENTS = [
  { name: "Claude Code", icon: "/agents/claude-code.svg" },
  { name: "Cursor", icon: "/agents/cursor.svg" },
  { name: "Windsurf", icon: "/agents/windsurf.svg" },
  { name: "GitHub Copilot", icon: "/agents/copilot.svg" },
  { name: "Codex", icon: "/agents/codex.svg" },
  { name: "Gemini", icon: "/agents/gemini.svg" },
  { name: "Goose", icon: "/agents/goose.svg" },
  { name: "Roo", icon: "/agents/roo.svg" },
  { name: "Kilo", icon: "/agents/kilo.svg" },
  { name: "Kiro CLI", icon: "/agents/kiro-cli.svg" },
  { name: "AMP", icon: "/agents/amp.svg" },
  { name: "Trae", icon: "/agents/trae.svg" },
  { name: "Droid", icon: "/agents/droid.svg" },
  { name: "OpenCode", icon: "/agents/opencode.svg" },
  { name: "ClawdBot", icon: "/agents/clawdbot.svg" },
  { name: "Antigravity", icon: "/agents/antigravity.svg" },
];

export function AgentCarousel() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Double the agents for seamless loop
  const duplicatedAgents = [...AGENTS, ...AGENTS];

  return (
    <div className="w-full overflow-hidden py-4">
      {/* Carousel container */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex gap-8 carousel-scroll" style={{ width: "fit-content" }}>
          {duplicatedAgents.map((agent, index) => (
            <div
              key={`${agent.name}-${index}`}
              className="relative flex-shrink-0 group"
              onMouseEnter={() => setHoveredAgent(agent.name)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              {/* Icon */}
              <img
                src={agent.icon}
                alt={agent.name}
                className="w-14 h-14 object-contain opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer"
              />

              {/* Tooltip */}
              {hoveredAgent === agent.name && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white whitespace-nowrap z-20">
                  {agent.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
