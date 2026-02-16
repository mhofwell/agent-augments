import type { Framework } from "@/types/database";

export type CompleteTier = "complete" | "partial" | "minimal";

export interface CompletenessResult {
  score: number;
  tier: CompleteTier;
  missingFields: string[];
}

const WEIGHTS: Record<string, { weight: number; check: (fw: Framework) => boolean }> = {
  // Core (45 points)
  name: { weight: 8, check: (fw) => !!fw.name },
  slug: { weight: 4, check: (fw) => !!fw.slug },
  description: { weight: 12, check: (fw) => !!fw.description && fw.description.length > 20 },
  install_command: { weight: 8, check: (fw) => !!fw.install_command },
  github_url: { weight: 6, check: (fw) => !!fw.github_url },
  stars: { weight: 4, check: (fw) => (fw.stars ?? 0) > 0 },
  how_it_works: { weight: 3, check: (fw) => !!fw.how_it_works },

  // GitHub Stats (20 points)
  contributors_count: { weight: 8, check: (fw) => (fw.contributors_count ?? 0) > 0 },
  last_commit_at: { weight: 6, check: (fw) => !!fw.last_commit_at },
  open_issues_count: { weight: 6, check: (fw) => fw.open_issues_count !== null },

  // Components (25 points)
  has_skills: { weight: 8, check: (fw) => (fw.skills_count ?? 0) > 0 },
  has_mcps: { weight: 6, check: (fw) => (fw.mcps_count ?? 0) > 0 },
  has_subagents: { weight: 6, check: (fw) => (fw.subagents_count ?? 0) > 0 },
  has_claude_md: { weight: 5, check: (fw) => !!fw.has_claude_md },

  // Enrichment (10 points)
  methodology: { weight: 5, check: (fw) => !!fw.methodology },
  autonomy_level: { weight: 5, check: (fw) => !!fw.autonomy_level },
};

const MAX_SCORE = Object.values(WEIGHTS).reduce((sum, w) => sum + w.weight, 0);

export function calculateCompletenessScore(framework: Framework): CompletenessResult {
  let score = 0;
  const missingFields: string[] = [];

  for (const [field, { weight, check }] of Object.entries(WEIGHTS)) {
    if (check(framework)) {
      score += weight;
    } else {
      missingFields.push(field);
    }
  }

  const normalized = Math.round((score / MAX_SCORE) * 100);
  const tier: CompleteTier = normalized >= 80 ? "complete" : normalized >= 50 ? "partial" : "minimal";

  return { score: normalized, tier, missingFields };
}
