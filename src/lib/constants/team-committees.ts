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
export const COMMITTEE_PERMISSION_MAP: Record<TeamCommittee, string> = {
  "Organising Committee": "team:organising",
  "Technical Committee": "team:technical",
  "Sponsorship Committee": "team:sponsorship",
  "Social Media & Media Committee": "team:social_media",
  "Digital Committee": "team:digital",
  "Documentation Committee": "team:documentation",
  "Publicity Committee": "team:publicity",
  "Operations Committee": "team:operations",
  "Event Management Committee": "team:event_management",
  "Crew Committee": "team:crew",
};

export function getAllowedCommittees(
  userPermissionKeys: string[],
  isAdmin: boolean,
): TeamCommittee[] {
  if (isAdmin) return [...TEAM_COMMITTEES];

  return TEAM_COMMITTEES.filter((committee) => {
    const requiredKey = COMMITTEE_PERMISSION_MAP[committee];
    return userPermissionKeys.includes(requiredKey);
  });
}

