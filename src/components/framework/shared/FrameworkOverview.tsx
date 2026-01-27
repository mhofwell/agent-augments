"use client";

import { Zap, Server, Bot, Settings } from "lucide-react";
import { getFrameworkWorkflow } from "@/lib/framework-config";
import { AGENT_CONFIG_TYPES } from "@/lib/framework-config";
import { cn } from "@/lib/utils";
import type { FrameworkWithComponents } from "@/types/database";

interface FrameworkOverviewProps {
  framework: FrameworkWithComponents;
  className?: string;
}

/**
 * Unified two-column layout showing:
 * - Left: Simplified workflow (command → artifact)
 * - Right: What's Included file tree
 */
export function FrameworkOverview({
  framework,
  className,
}: FrameworkOverviewProps) {
  const workflow = getFrameworkWorkflow(framework.slug);

  const skills = framework.skills || [];
  const mcps = framework.mcps || [];
  const subagents = framework.subagents || [];
  const agentConfigs = AGENT_CONFIG_TYPES.filter((config) => framework[config.key]);

  const hasInventory = skills.length > 0 || mcps.length > 0 || subagents.length > 0 || agentConfigs.length > 0;

  // If no workflow and no inventory, don't render
  if (!workflow && !hasInventory) return null;

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/30", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
        {/* Left: Workflow */}
        {workflow && (
          <div className="p-5">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
              How It Works
            </h3>

            {/* Simplified workflow steps */}
            <div className="relative pl-5">
              {/* Vertical spine */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-lime-500/50 via-lime-500/30 to-lime-500/10" />

              <div className="space-y-5">
                {workflow.steps.map((step, i) => (
                  <div key={step.id} className="relative">
                    {/* Step number circle */}
                    <div className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-lime-500/20 border border-lime-500/60 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-lime-400">{i + 1}</span>
                    </div>

                    {/* Command + Description + Artifact */}
                    <div className="space-y-1">
                      <code className="text-base font-mono text-white">
                        {step.command}
                      </code>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {step.aiAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right: What's Included */}
        {hasInventory && (
          <div className="p-5">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
              Augments
            </h3>

            <div className="font-mono text-base">
              {/* Root */}
              <div className="text-zinc-400 mb-3">
                <span className="text-zinc-500">~/</span>
                <span className="text-white">.claude</span>
              </div>

              {/* Skills */}
              {skills.length > 0 && (
                <div className="ml-3 mb-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-600">├─</span>
                    <Zap size={14} className="text-zinc-400" />
                    <span className="text-white">skills/</span>
                    <span className="text-zinc-600">{skills.length}</span>
                  </div>
                  <div className="ml-6 text-sm leading-6 text-zinc-500">
                    {skills.slice(0, 4).map((skill, idx) => {
                      const isLast = idx === Math.min(skills.length, 4) - 1 && skills.length <= 4;
                      return (
                        <div key={skill.id} className="flex items-center">
                          <span className="text-zinc-700 select-none">{isLast ? "└─" : "├─"}</span>
                          <span className="ml-1 text-zinc-500">{skill.name}</span>
                        </div>
                      );
                    })}
                    {skills.length > 4 && (
                      <div className="flex items-center">
                        <span className="text-zinc-700 select-none">└─</span>
                        <span className="ml-1 text-zinc-600">+{skills.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MCPs */}
              {mcps.length > 0 && (
                <div className="ml-3 mb-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-600">{subagents.length > 0 || agentConfigs.length > 0 ? "├─" : "└─"}</span>
                    <Server size={14} className="text-zinc-400" />
                    <span className="text-white">mcp-servers/</span>
                    <span className="text-zinc-600">{mcps.length}</span>
                  </div>
                  <div className="ml-6 text-sm leading-6 text-zinc-500">
                    {mcps.slice(0, 3).map((mcp, idx) => {
                      const isLast = idx === Math.min(mcps.length, 3) - 1 && mcps.length <= 3;
                      return (
                        <div key={mcp.id} className="flex items-center">
                          <span className="text-zinc-700 select-none">{isLast ? "└─" : "├─"}</span>
                          <span className="ml-1 text-zinc-500">{mcp.name}</span>
                        </div>
                      );
                    })}
                    {mcps.length > 3 && (
                      <div className="flex items-center">
                        <span className="text-zinc-700 select-none">└─</span>
                        <span className="ml-1 text-zinc-600">+{mcps.length - 3} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subagents */}
              {subagents.length > 0 && (
                <div className="ml-3 mb-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-600">{agentConfigs.length > 0 ? "├─" : "└─"}</span>
                    <Bot size={14} className="text-zinc-400" />
                    <span className="text-white">agents/</span>
                    <span className="text-zinc-600">{subagents.length}</span>
                  </div>
                  <div className="ml-6 text-sm leading-6 text-zinc-500">
                    {subagents.slice(0, 3).map((agent, idx) => {
                      const isLast = idx === Math.min(subagents.length, 3) - 1 && subagents.length <= 3;
                      return (
                        <div key={agent.id} className="flex items-center">
                          <span className="text-zinc-700 select-none">{isLast ? "└─" : "├─"}</span>
                          <span className="ml-1 text-zinc-500">{agent.name}</span>
                        </div>
                      );
                    })}
                    {subagents.length > 3 && (
                      <div className="flex items-center">
                        <span className="text-zinc-700 select-none">└─</span>
                        <span className="ml-1 text-zinc-600">+{subagents.length - 3} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Config files */}
              {agentConfigs.length > 0 && (
                <div className="ml-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-600">└─</span>
                    <Settings size={14} className="text-zinc-400" />
                    <span className="text-white">config/</span>
                    <span className="text-zinc-600">{agentConfigs.length}</span>
                  </div>
                  <div className="ml-6 text-sm leading-6 text-zinc-500">
                    {agentConfigs.map((config, idx) => {
                      const isLast = idx === agentConfigs.length - 1;
                      return (
                        <div key={config.key} className="flex items-center">
                          <span className="text-zinc-700 select-none">{isLast ? "└─" : "├─"}</span>
                          <span className="ml-1 text-zinc-500">{config.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
