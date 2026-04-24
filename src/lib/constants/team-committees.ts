export const TEAM_COMMITTEES = [
  "Organising Committee",
  "Technical Committee",
  "Sponsorship Committee",
  "Social Media & Media Committee",
  "Digital Committee",
  "Documentation Committee",
  "Publicity Committee",
  "Operations Committee",
  "Event Management Committee",
  "Crew Committee",
] as const;

export type TeamCommittee = (typeof TEAM_COMMITTEES)[number];

export const TEAM_COMMITTEE_META: Record<
  TeamCommittee,
  { icon: string; description: string }
> = {
  "Organising Committee": {
    icon: "🏆",
    description:
      "The backbone of HackFest - planning and executing the vision.",
  },
  "Technical Committee": {
    icon: "💻",
    description:
      "Builds and maintains the platform, infra, and judging systems.",
  },
  "Sponsorship Committee": {
    icon: "🤝",
    description: "Secures partnerships and sponsorships to power HackFest.",
  },
  "Social Media & Media Committee": {
    icon: "📸",
    description: "Drives storytelling, outreach, and real-time event coverage.",
  },
  "Digital Committee": {
    icon: "🌐",
    description: "Owns digital assets, branding touchpoints, and web presence.",
  },
  "Documentation Committee": {
    icon: "📝",
    description: "Captures process docs, reports, and institutional knowledge.",
  },
  "Publicity Committee": {
    icon: "📣",
    description: "Amplifies HackFest through campaigns, posters, and outreach.",
  },
  "Operations Committee": {
    icon: "⚙️",
    description: "Handles logistics, resources, and on-ground coordination.",
  },
  "Event Management Committee": {
    icon: "🎯",
    description:
      "Designs participant experience from kickoff to final showcase.",
  },
  "Crew Committee": {
    icon: "🚀",
    description:
      "The rapid-response force that keeps every moment running smooth.",
  },
};
