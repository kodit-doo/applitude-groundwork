export const AGENTS = {
  anna: {
    name: "Anna",
    title: "AI Guide",
    avatar: "/agents/anna.png",
    initials: "AN",
    accentColor: "#DBF227",
    systemPromptTone: "warm" as const,
    description:
      "Guides you through product discovery with a warm, conversational approach.",
  },
  paul: {
    name: "Paul",
    title: "AI Guide",
    avatar: "/agents/paul.png",
    initials: "PL",
    accentColor: "#1E2429",
    systemPromptTone: "direct" as const,
    description:
      "Guides you through product discovery with a structured, direct approach.",
  },
} as const;

export type AgentKey = keyof typeof AGENTS;
export type AgentConfig = (typeof AGENTS)[AgentKey];

// Backwards-compat alias used by AgentAvatar default fallback
export const AGENT = AGENTS.anna;
