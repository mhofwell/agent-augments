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
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { formatRelativeTime } from "@/components/framework/framework-utils";
import {
  AgentCompatibilityRow,
  FrameworkOverview,
} from "@/components/framework/shared";
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
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-6">
          {/* Top row: Title on left, Agent icons on right */}
          <div className="flex items-start justify-between gap-5 mb-6">
            {/* Title + stats row */}
            <div>
              {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{framework.name}</h1>

                {/* Stats row - amber for quality signals, zinc for metadata */}
                <div className="flex items-center gap-5 text-sm flex-wrap">
                  {framework.stars && framework.stars > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-400 fill-amber-400/30" />
                      <span className="text-zinc-100">{framework.stars.toLocaleString()}</span>
                      <span className="text-zinc-400">stars</span>
                    </div>
                  )}
                  {framework.contributors_count && framework.contributors_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-400" />
                      <span className="text-zinc-100">{framework.contributors_count}</span>
                      <span className="text-zinc-400">contributors</span>
                    </div>
                  )}
                  {framework.last_commit_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-zinc-400" />
                      <span className="text-zinc-400">Updated</span>
                      <span className="text-zinc-100">{formatRelativeTime(framework.last_commit_at)}</span>
                    </div>
                  )}
                  {framework.open_issues_count !== null && framework.open_issues_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <GitMerge size={14} className="text-zinc-400" />
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
          <div className="flex items-center gap-3 px-4 py-3 bg-black rounded-xl font-mono text-sm border border-zinc-800 mb-4">
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

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {framework.homepage && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={framework.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen size={14} />
                  Documentation
                </a>
              </Button>
            )}
            {framework.github_url && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={framework.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={14} />
                  GitHub
                </a>
              </Button>
            )}
          </div>
          </div>
        </section>

        {/* Unified Overview: Workflow + What's Included */}
        <section className="mb-12">
          <FrameworkOverview framework={framework} />
        </section>

      </div>

      <SiteFooter />
    </div>
  );
}
