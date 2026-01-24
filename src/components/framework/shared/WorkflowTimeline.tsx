"use client";

import { User, Bot, FileCode, ArrowRight } from "lucide-react";
import { getFrameworkWorkflow } from "@/lib/framework-config";
import { cn } from "@/lib/utils";

interface WorkflowTimelineProps {
  frameworkSlug: string | null | undefined;
  className?: string;
}

/**
 * Displays the actual development workflow for a framework.
 * Shows CLI commands, human decision points, and AI actions.
 * Returns null if no workflow is defined for this framework.
 */
export function WorkflowTimeline({
  frameworkSlug,
  className,
}: WorkflowTimelineProps) {
  const workflow = getFrameworkWorkflow(frameworkSlug);
  if (!workflow) return null;

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/30 p-5", className)}>
      {/* Header */}
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">
        Development Workflow
      </h2>

      {/* Philosophy */}
      <p className="text-sm text-zinc-400 italic mb-6">
        &ldquo;{workflow.philosophy}&rdquo;
      </p>

      {/* Workflow steps with continuous spine */}
      <div className="relative pl-6 sm:pl-8">
        {/* Continuous vertical spine */}
        <div className="absolute left-[9px] sm:left-[11px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800 rounded-full" />

        {/* Steps */}
        <div className="space-y-6">
          {workflow.steps.map((step, i) => (
            <div key={step.id} className="relative group">
              {/* Step number badge - punches through the spine */}
              <div className="absolute -left-6 sm:-left-8 top-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-900 border-2 border-lime-500/60 shadow-[0_0_8px_rgba(163,230,53,0.2)] flex items-center justify-center z-10">
                <span className="text-[10px] sm:text-xs font-semibold text-lime-400">{i + 1}</span>
              </div>

              {/* Step content */}
              <div className="space-y-3">
                {/* Command hero */}
                <code className="inline-block text-base font-mono font-medium text-lime-400 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/50 group-hover:shadow-[0_0_15px_rgba(163,230,53,0.1)] transition-shadow">
                  {step.command}
                </code>

                {/* Transformation row: Human → AI → Artifact */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
                  {/* Human decision */}
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-cyan-400 flex-shrink-0" />
                    <span className="text-zinc-300">{step.humanDecision}</span>
                  </div>

                  <ArrowRight size={14} className="text-zinc-600 hidden sm:block flex-shrink-0" />

                  {/* AI action */}
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-violet-400 flex-shrink-0" />
                    <span className="text-zinc-400">{step.aiAction}</span>
                  </div>

                  {/* Artifact badge */}
                  {step.artifact && (
                    <>
                      <ArrowRight size={14} className="text-zinc-600 hidden sm:block flex-shrink-0" />
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 w-fit">
                        <FileCode size={12} className="text-emerald-400 flex-shrink-0" />
                        <span className="font-mono text-xs font-medium text-emerald-300">
                          {step.artifact}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
