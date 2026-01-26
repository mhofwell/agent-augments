-- Curated enrichment for Claude Flow framework
-- Run with: bun run supabase:sql scripts/enrichments/claude-flow.sql
-- Or apply directly in Supabase SQL Editor

UPDATE frameworks
SET
  -- Fix description (neutral, factual)
  description = 'Multi-agent orchestration framework for Claude Code. Coordinates specialized AI agents in swarm topologies (mesh, hierarchical, ring, star) with self-learning capabilities and distributed consensus.',

  -- Fix install command (was pointing to wrong package)
  install_command = 'npx claude-flow@v3alpha init',
  install_tool = 'npx',

  -- Curated features (pulled from their docs, condensed)
  features = ARRAY[
    '60+ specialized agents across development, testing, and architecture',
    'Multiple swarm topologies: mesh, hierarchical, ring, star',
    'Self-learning with pattern recognition (SONA architecture)',
    'Multi-provider LLM support: Anthropic, OpenAI, Google, Ollama',
    'HNSW vector search for fast memory retrieval',
    'Byzantine fault tolerance for distributed agent consensus',
    'Native MCP protocol integration with Claude Code'
  ],

  -- Curated use cases (what it''s actually good for)
  use_cases = ARRAY[
    'Multi-agent software development',
    'Automated code review pipelines',
    'Large codebase refactoring',
    'Distributed task orchestration',
    'Security auditing workflows'
  ],

  -- Homepage should point to docs, not Discord
  homepage = 'https://github.com/ruvnet/claude-flow#readme',

  updated_at = NOW()
WHERE slug = 'claude-flow';

-- Verify the update
SELECT
  name,
  description,
  install_command,
  features,
  use_cases,
  homepage
FROM frameworks
WHERE slug = 'claude-flow';
