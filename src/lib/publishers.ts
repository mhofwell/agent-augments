// Publisher configuration for official branding
// Publishers with logos and official status

export type Publisher = {
  id: string;
  name: string;
  displayName: string;
  logo?: string; // URL or component name
  color: string;
  isOfficial: boolean;
};

// Map marketplace github_owner to publisher config
export const publishers: Record<string, Publisher> = {
  anthropics: {
    id: "anthropics",
    name: "anthropics",
    displayName: "Anthropic",
    color: "#D97706", // amber-600
    isOfficial: true,
  },
  "anthropic-official": {
    id: "anthropic-official",
    name: "anthropic-official",
    displayName: "Anthropic",
    color: "#D97706",
    isOfficial: true,
  },
};

// Get publisher by marketplace owner
export function getPublisher(githubOwner: string): Publisher | null {
  return publishers[githubOwner.toLowerCase()] || null;
}

// Check if a marketplace is from an official publisher
export function isOfficialPublisher(githubOwner: string): boolean {
  const publisher = getPublisher(githubOwner);
  return publisher?.isOfficial ?? false;
}

// Category display name mapping
export const categoryDisplayNames: Record<string, string> = {
  development: "Development",
  "code-review": "Code Review",
  documentation: "Documentation",
  testing: "Testing",
  security: "Security",
  productivity: "Productivity",
  workflow: "Workflow",
  debugging: "Debugging",
  refactoring: "Refactoring",
  deployment: "Deployment",
  general: "General",
  agents: "Agents",
  explore: "Explore",
  plan: "Planning",
};

// Get friendly display name for category
export function getCategoryDisplayName(category: string | null | undefined): string {
  if (!category) return "General";
  return categoryDisplayNames[category.toLowerCase()] ||
    // Title case fallback
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/-/g, " ");
}
