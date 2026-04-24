"use client";

import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  TEAM_COMMITTEES,
  TEAM_COMMITTEE_META,
  type TeamCommittee,
} from "~/lib/constants/team-committees";

type CommitteeMember = {
  id: string;
  name: string;
  role: string;
  photo: string | null;
  committee: TeamCommittee;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    email?: string;
  };
  order: number;
  isActive: boolean;
};

type CommitteePayload = {
  committee: TeamCommittee;
  members: CommitteeMember[];
};

type FacultyCoordinator = {
  id: string;
  name: string;
  designation: string;
  department: string;
  photo: string;
  githubHandle?: string;
  instagramHandle?: string;
};

const makeAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff&bold=true`;

const facultyData: FacultyCoordinator[] = [
  {
    id: "faculty-1",
    name: "Dr. Shreya Nayak",
    designation: "Faculty Coordinator",
    department: "Computer Science & Engineering",
    photo: makeAvatar("Dr. Shreya Nayak"),
    githubHandle: "drshreyan",
    instagramHandle: "dr.shreya.nayak",
  },
  {
    id: "faculty-2",
    name: "Prof. Raghavendra B",
    designation: "Faculty Coordinator",
    department: "Information Science & Engineering",
    photo: makeAvatar("Prof. Raghavendra B"),
    githubHandle: "raghavendrab",
    instagramHandle: "prof.raghavendra",
  },
  {
    id: "faculty-3",
    name: "Dr. Meera D'Souza",
    designation: "Faculty Coordinator",
    department: "Artificial Intelligence & Data Science",
    photo: makeAvatar("Dr. Meera D'Souza"),
    githubHandle: "drmeerads",
    instagramHandle: "dr.meera.dsouza",
  },
  {
    id: "faculty-4",
    name: "Name Here",
    designation: "Faculty Coordinator",
    department: "Department Name",
    photo: makeAvatar("Name Here"),
  },
];

export default function CommitteesShowcase() {
  const [activeSection, setActiveSection] = useState<"core" | "faculty">(
    "core",
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [committeeGroups, setCommitteeGroups] = useState<CommitteePayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadCommittees = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const res = await fetch("/api/teams", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load team members");
        }

        const data = (await res.json()) as { committees?: CommitteePayload[] };
        setCommitteeGroups(data.committees ?? []);
      } catch (error) {
        console.error("Failed to fetch committees:", error);
        setLoadError("Unable to load committees right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCommittees();
  }, []);

  const totalMembers = useMemo(
    () =>
      committeeGroups.reduce(
        (count, committee) => count + committee.members.length,
        0,
      ),
    [committeeGroups],
  );

  const visibleCommittees =
    activeFilter === "all"
      ? committeeGroups
      : committeeGroups.filter((committee) => committee.committee === activeFilter);

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8 lg:pt-32">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-200/20 bg-linear-to-br from-slate-950/75 via-cyan-950/40 to-slate-900/70 px-6 py-12 shadow-[0_0_80px_rgba(14,116,144,0.25)] backdrop-blur-sm md:px-10 md:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.15),transparent_40%),radial-gradient(circle_at_60%_80%,rgba(251,191,36,0.12),transparent_35%)]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <p className="font-crimson text-sm tracking-[0.3em] text-cyan-100/90 uppercase">
            HackFest&apos;26 Committees
          </p>
          <h1 className="font-pirate text-4xl leading-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
            The People Behind HackFest
          </h1>
          <p className="max-w-2xl font-crimson text-lg text-cyan-50/90 md:text-xl">
            A cross-functional team turning bold ideas into a 36-hour innovation
            experience.
          </p>

          <div className="grid gap-3 pt-3 sm:grid-cols-3">
            <StatChip label="Committees" value={`${committeeGroups.length}`} />
            <StatChip label="Members" value={`${totalMembers}+`} />
            <StatChip label="Faculty" value={`${facultyData.length}`} />
          </div>
        </div>
      </div>

      <div className="mt-8 inline-flex rounded-full border border-cyan-200/25 bg-slate-900/60 p-1 backdrop-blur-sm">
        <SectionTab
          label="Core Team"
          active={activeSection === "core"}
          onClick={() => setActiveSection("core")}
        />
        <SectionTab
          label="Faculty"
          active={activeSection === "faculty"}
          onClick={() => setActiveSection("faculty")}
        />
      </div>

      {activeSection === "core" ? (
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <FilterChip
            label="All Committees"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          {TEAM_COMMITTEES.map((committee) => (
            <FilterChip
              key={committee}
              label={committee}
              active={activeFilter === committee}
              onClick={() => setActiveFilter(committee)}
            />
          ))}
        </div>
      ) : null}

      {activeSection === "core" ? (
        <div className="mt-8 space-y-8">
          {isLoading ? (
            <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-6 font-crimson text-cyan-50/85">
              Loading team members...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-6 font-crimson text-red-100">
              {loadError}
            </div>
          ) : visibleCommittees.length === 0 ? (
            <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-6 font-crimson text-cyan-50/85">
              No team members found for the selected committee.
            </div>
          ) : (
            visibleCommittees.map((committeeGroup) => {
              const meta = TEAM_COMMITTEE_META[committeeGroup.committee];

              return (
                <section
                  key={committeeGroup.committee}
                  className="rounded-2xl border border-cyan-200/20 bg-linear-to-b from-slate-900/85 via-slate-900/70 to-slate-950/70 p-6 backdrop-blur-md"
                >
                  <div className="mb-6">
                    <p className="inline-flex items-center gap-2 font-crimson text-xs tracking-[0.2em] text-cyan-100/75 uppercase">
                      <span aria-hidden className="text-lg leading-none">
                        {meta.icon}
                      </span>
                      Committee
                    </p>
                    <h2 className="pt-1 font-pirate text-3xl text-white">
                      {committeeGroup.committee}
                    </h2>
                    <p className="mt-2 font-crimson text-lg text-cyan-50/80">
                      {meta.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {committeeGroup.members.map((member) => (
                      <article
                        key={member.id}
                        className="flex min-h-96 flex-col rounded-xl border border-cyan-200/20 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/45 hover:shadow-[0_16px_32px_rgba(3,105,161,0.25)]"
                      >
                        <div className="mx-auto mb-4 aspect-square w-full max-w-65 overflow-hidden rounded-xl border-2 border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.45)] sm:max-w-75">
                          <img
                            src={member.photo || makeAvatar(member.name)}
                            alt={member.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="text-center font-crimson text-2xl font-bold text-white">
                          {member.name}
                        </h3>
                        <p className="text-center font-crimson text-base text-cyan-100/75">
                          {member.role}
                        </p>

                        <div className="mt-auto pt-4 grid gap-2">
                          <SocialLinkRow
                            platform="linkedin"
                            href={member.socialLinks?.linkedin}
                          />
                          <SocialLinkRow
                            platform="github"
                            href={member.socialLinks?.github}
                          />
                          <SocialLinkRow
                            platform="twitter"
                            href={member.socialLinks?.twitter}
                          />
                          <SocialLinkRow
                            platform="instagram"
                            href={member.socialLinks?.instagram}
                          />
                          <SocialLinkRow
                            platform="email"
                            href={member.socialLinks?.email}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {facultyData.map((faculty) => {
            return (
              <article
                key={faculty.id}
                className={[
                  "group relative flex min-h-80 flex-col rounded-2xl border p-6 transition-all duration-500",
                  "bg-linear-to-b from-slate-900/85 via-slate-900/70 to-slate-950/70 backdrop-blur-md",
                  "border-cyan-200/20 hover:border-cyan-200/45",
                ].join(" ")}
              >
                <div className="mx-auto mb-4 aspect-square w-full max-w-65 overflow-hidden rounded-2xl border-2 border-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.45)] sm:max-w-75">
                  <img
                    src={faculty.photo}
                    alt={faculty.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <h2 className="text-center font-crimson text-2xl font-bold text-white">
                  {faculty.name}
                </h2>
                <p className="mt-2 text-center font-crimson text-lg text-cyan-100/80">
                  {faculty.designation}
                </p>
                <p className="mt-1 text-center font-crimson text-sm text-cyan-50/70">
                  {faculty.department}
                </p>

                <div className="mt-auto pt-4 grid gap-2">
                  <SocialHandleLink
                    platform="github"
                    handle={faculty.githubHandle}
                  />
                  <SocialHandleLink
                    platform="instagram"
                    handle={faculty.instagramHandle}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-11 shrink-0 rounded-full border px-4 font-crimson text-sm font-semibold transition-all duration-300",
        "focus:outline-hidden focus:ring-2 focus:ring-cyan-300/60",
        active
          ? "border-cyan-200/80 bg-cyan-200/25 text-white"
          : "border-cyan-100/20 bg-slate-900/60 text-cyan-100/80 hover:border-cyan-100/40 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SectionTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-11 rounded-full px-5 font-crimson text-sm font-semibold transition-all duration-300",
        "focus:outline-hidden focus:ring-2 focus:ring-cyan-300/60",
        active
          ? "bg-cyan-200/25 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)]"
          : "text-cyan-100/75 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyan-200/20 bg-slate-900/45 px-4 py-3 backdrop-blur-sm">
      <p className="font-crimson text-xs tracking-[0.2em] text-cyan-100/70 uppercase">
        {label}
      </p>
      <p className="pt-1 font-pirate text-2xl text-white">{value}</p>
    </div>
  );
}

function SocialHandleLink({
  platform,
  handle,
}: {
  platform: "github" | "instagram";
  handle?: string;
}) {
  const normalizedHandle = handle?.trim().replace(/^@/, "");
  const isGithub = platform === "github";
  const Icon = isGithub ? Github : Instagram;
  const label = isGithub ? "GitHub" : "Instagram";

  if (!normalizedHandle) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-cyan-200/20 bg-slate-900/50 px-3 py-2 text-xs font-crimson text-cyan-50/60">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className="text-cyan-100/45">Handle not added</span>
      </div>
    );
  }

  const href = isGithub
    ? `https://github.com/${normalizedHandle}`
    : `https://instagram.com/${normalizedHandle}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border border-cyan-200/25 bg-slate-900/60 px-3 py-2 text-xs font-crimson text-cyan-50 transition-colors hover:border-cyan-200/45 hover:bg-slate-800/70"
      aria-label={`${label} profile of ${normalizedHandle}`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span>@{normalizedHandle}</span>
    </a>
  );
}

function SocialLinkRow({
  platform,
  href,
}: {
  platform: "linkedin" | "github" | "twitter" | "instagram" | "email";
  href?: string;
}) {
  const safeHref = href?.trim();

  const config = {
    linkedin: { label: "LinkedIn", Icon: Linkedin },
    github: { label: "GitHub", Icon: Github },
    twitter: { label: "Twitter/X", Icon: Twitter },
    instagram: { label: "Instagram", Icon: Instagram },
    email: { label: "Email", Icon: Mail },
  } as const;

  const { label, Icon } = config[platform];

  if (!safeHref) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-cyan-200/20 bg-slate-900/50 px-3 py-2 text-xs font-crimson text-cyan-50/60">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className="text-cyan-100/45">Not added</span>
      </div>
    );
  }

  const finalHref = platform === "email" ? `mailto:${safeHref}` : safeHref;

  return (
    <a
      href={finalHref}
      target={platform === "email" ? undefined : "_blank"}
      rel={platform === "email" ? undefined : "noreferrer"}
      className="flex items-center justify-between rounded-lg border border-cyan-200/25 bg-slate-900/60 px-3 py-2 text-xs font-crimson text-cyan-50 transition-colors hover:border-cyan-200/45 hover:bg-slate-800/70"
      aria-label={`${label} link`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="max-w-36 truncate">Open</span>
    </a>
  );
}
