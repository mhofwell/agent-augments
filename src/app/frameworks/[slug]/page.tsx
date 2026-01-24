"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Copy,
  Check,
  Github,
  Users,
  Clock,
  GitMerge,
  Zap,
  Server,
  Bot,
  BookOpen,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout";
import { formatRelativeTime } from "@/components/framework/framework-utils";
import {
  AgentCompatibilityRow,
  MethodologyCard,
  AutonomyCard,
  UseCasesBadges,
  FeaturesList,
  WorkflowTimeline,
} from "@/components/framework/shared";
import { AGENT_CONFIG_TYPES } from "@/lib/framework-config";
import type { FrameworkWithComponents } from "@/types/database";

export default function FrameworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [framework, setFramework] = useState<FrameworkWithComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchFramework() {
      try {
        const res = await fetch(`/api/frameworks/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setFramework(data);
        }
      } catch (error) {
        console.error("Failed to fetch framework:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFramework();
  }, [slug]);

  const copyCommand = async () => {
    if (!framework?.install_command) return;
    try {
      await navigator.clipboard.writeText(framework.install_command);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste in your terminal to install",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-48 mb-4" />
            <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!framework) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-bold mb-4">Framework not found</h1>
          <p className="text-zinc-400">The framework you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

      <SiteHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Frameworks
        </button>

        {/* Hero Section */}
        <section className="mb-12">
          {/* Top row: Title on left, Agent icons on right */}
          <div className="flex items-start justify-between gap-5 mb-6">
            {/* Title + stats row */}
            <div>
              {/* Title */}
                <h1 className="text-3xl font-bold mb-2">{framework.name}</h1>

                {/* Stats row */}
                <div className="flex items-center gap-5 text-sm flex-wrap">
                  {framework.stars && framework.stars > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-300" />
                      <span className="text-zinc-100">{framework.stars.toLocaleString()}</span>
                      <span className="text-zinc-400">stars</span>
                    </div>
                  )}
                  {framework.contributors_count && framework.contributors_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-cyan-400" />
                      <span className="text-zinc-100">{framework.contributors_count}</span>
                      <span className="text-zinc-400">contributors</span>
                    </div>
                  )}
                  {framework.last_commit_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-400" />
                      <span className="text-zinc-400">Updated</span>
                      <span className="text-zinc-100">{formatRelativeTime(framework.last_commit_at)}</span>
                    </div>
                  )}
                  {framework.open_issues_count !== null && framework.open_issues_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <GitMerge size={14} className="text-violet-400" />
                      <span className="text-zinc-100">{framework.open_issues_count}</span>
                      <span className="text-zinc-400">open issues</span>
                    </div>
                  )}
                </div>
            </div>

            {/* Agent compatibility icons - top right */}
            <AgentCompatibilityRow
              item={framework}
              size="lg"
              className="flex-shrink-0"
            />
          </div>

          {/* Description */}
          <p className="text-lg text-zinc-300 leading-relaxed mb-6">
            {framework.description || "No description available"}
          </p>

          {/* Install command */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-xl font-mono text-sm border border-zinc-800 mb-4">
            <span className="text-zinc-500 select-none">$</span>
            <code className="text-lime-400 flex-1 overflow-x-auto whitespace-nowrap">
              {framework.install_command}
            </code>
            <button
              onClick={copyCommand}
              className="flex-shrink-0 p-1.5 hover:bg-zinc-800 rounded transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-zinc-500" />
              )}
            </button>
          </div>

          {/* Action links */}
          <div className="flex items-center gap-4">
            {framework.homepage && (
              <a
                href={framework.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <BookOpen size={16} />
                Documentation
              </a>
            )}
            {framework.github_url && (
              <a
                href={framework.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <Github size={16} />
                GitHub
              </a>
            )}
          </div>
        </section>

        {/* Development Workflow - framework-specific */}
        <section className="mb-12">
          <WorkflowTimeline frameworkSlug={slug} />
        </section>

        {/* Methodology & Autonomy badges (compact, below workflow) */}
        {(framework.methodology || framework.autonomy_level) && (
          <div className="flex flex-wrap gap-2 mb-12">
            <MethodologyCard methodology={framework.methodology} variant="compact" />
            <AutonomyCard autonomyLevel={framework.autonomy_level} variant="compact" />
          </div>
        )}

        {/* Best For - Use cases badges */}
        {framework.use_cases && framework.use_cases.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4 text-zinc-200">Best For</h2>
            <UseCasesBadges useCases={framework.use_cases} />
          </section>
        )}

        {/* Features */}
        {framework.features && framework.features.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4 text-zinc-200">Features</h2>
            <FeaturesList features={framework.features} />
          </section>
        )}

        {/* What's Included */}
        {(() => {
          const skills = framework.skills || [];
          const mcps = framework.mcps || [];
          const subagents = framework.subagents || [];
          const agentConfigs = AGENT_CONFIG_TYPES.filter((config) => framework[config.key]);

          const hasContent = skills.length > 0 || mcps.length > 0 || subagents.length > 0 || agentConfigs.length > 0;
          if (!hasContent) return null;

          return (
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-white mb-4">What&apos;s Included</h2>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 font-mono text-sm">
                {/* Root */}
                <div className="text-zinc-400 mb-2">
                  <span className="text-zinc-500">~/</span>
                  <span className="text-white">.claude</span>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="ml-4 mb-3">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <span>├──</span>
                      <Zap size={14} className="text-cyan-400" />
                      <span className="text-cyan-400">skills/</span>
                      <span className="text-zinc-600">{skills.length}</span>
                    </div>
                    <div className="ml-8 text-[11px] leading-5">
                      {skills.slice(0, 6).map((skill, idx) => {
                        const isLast = idx === Math.min(skills.length, 6) - 1 && skills.length <= 6;
                        return (
                          <div key={skill.id} className="flex items-center">
                            <span className="text-zinc-600 select-none">{isLast ? "└─" : "├─"}</span>
                            <span className="ml-1.5 text-zinc-400">{skill.name}</span>
                          </div>
                        );
                      })}
                      {skills.length > 6 && (
                        <div className="flex items-center">
                          <span className="text-zinc-600 select-none">└─</span>
                          <span className="ml-1.5 text-zinc-600">+{skills.length - 6} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MCPs */}
                {mcps.length > 0 && (
                  <div className="ml-4 mb-3">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <span>{subagents.length > 0 || agentConfigs.length > 0 ? "├──" : "└──"}</span>
                      <Server size={14} className="text-violet-400" />
                      <span className="text-violet-400">mcp-servers/</span>
                      <span className="text-zinc-600">{mcps.length}</span>
                    </div>
                    <div className="ml-8 text-[11px] leading-5">
                      {mcps.slice(0, 6).map((mcp, idx) => {
                        const isLast = idx === Math.min(mcps.length, 6) - 1 && mcps.length <= 6;
                        return (
                          <div key={mcp.id} className="flex items-center">
                            <span className="text-zinc-600 select-none">{isLast ? "└─" : "├─"}</span>
                            <span className="ml-1.5 text-zinc-400">{mcp.name}</span>
                          </div>
                        );
                      })}
                      {mcps.length > 6 && (
                        <div className="flex items-center">
                          <span className="text-zinc-600 select-none">└─</span>
                          <span className="ml-1.5 text-zinc-600">+{mcps.length - 6} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subagents */}
                {subagents.length > 0 && (
                  <div className="ml-4 mb-3">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <span>{agentConfigs.length > 0 ? "├──" : "└──"}</span>
                      <Bot size={14} className="text-amber-400" />
                      <span className="text-amber-400">agents/</span>
                      <span className="text-zinc-600">{subagents.length}</span>
                    </div>
                    <div className="ml-8 text-[11px] leading-5">
                      {subagents.slice(0, 6).map((agent, idx) => {
                        const isLast = idx === Math.min(subagents.length, 6) - 1 && subagents.length <= 6;
                        return (
                          <div key={agent.id} className="flex items-center">
                            <span className="text-zinc-600 select-none">{isLast ? "└─" : "├─"}</span>
                            <span className="ml-1.5 text-zinc-400">{agent.name}</span>
                          </div>
                        );
                      })}
                      {subagents.length > 6 && (
                        <div className="flex items-center">
                          <span className="text-zinc-600 select-none">└─</span>
                          <span className="ml-1.5 text-zinc-600">+{subagents.length - 6} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Config files */}
                {agentConfigs.length > 0 && (
                  <div className="ml-4">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <span>└──</span>
                      <Settings size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">config/</span>
                      <span className="text-zinc-600">{agentConfigs.length}</span>
                    </div>
                    <div className="ml-8 text-[11px] leading-5">
                      {agentConfigs.map((config, idx) => {
                        const isLast = idx === agentConfigs.length - 1;
                        return (
                          <div key={config.key} className="flex items-center">
                            <span className="text-zinc-600 select-none">{isLast ? "└─" : "├─"}</span>
                            <span className="ml-1.5 text-zinc-400">{config.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* Footer links */}
        <section className="border-t border-zinc-800 pt-8 pb-12">
          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
            {framework.github_url && (
              <a
                href={`${framework.github_url}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                Report an issue
              </a>
            )}
            {framework.github_url && (
              <a
                href={`${framework.github_url}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                Discussions
              </a>
            )}
            {framework.homepage && (
              <a
                href={framework.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                Documentation
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
