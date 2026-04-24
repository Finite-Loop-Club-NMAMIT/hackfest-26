"use client";

import { Github, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { type TeamCommittee } from "~/lib/constants/team-committees";

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
  const [committeeGroups, setCommitteeGroups] = useState<CommitteePayload[]>(
    [],
  );
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
      committeeGroups
        .filter((committee) => committee.members.length > 0)
        .reduce((count, committee) => count + committee.members.length, 0),
    [committeeGroups],
  );

  const nonEmptyCommittees = useMemo(
    () => committeeGroups.filter((committee) => committee.members.length > 0),
    [committeeGroups],
  );

  const availableCommitteeNames = useMemo(
    () => nonEmptyCommittees.map((committee) => committee.committee),
    [nonEmptyCommittees],
  );

  useEffect(() => {
    if (activeFilter === "all") {
      return;
    }

    if (!availableCommitteeNames.includes(activeFilter as TeamCommittee)) {
      setActiveFilter("all");
    }
  }, [activeFilter, availableCommitteeNames]);

  const visibleCommittees =
    activeFilter === "all"
      ? nonEmptyCommittees
      : nonEmptyCommittees.filter(
          (committee) => committee.committee === activeFilter,
        );

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-18 pt-28 text-white sm:px-6 lg:px-8 lg:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-55">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_86%_16%,rgba(251,191,36,0.14),transparent_36%),radial-gradient(circle_at_50%_90%,rgba(6,182,212,0.13),transparent_35%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-cyan-200/20 bg-linear-to-br from-slate-950/80 via-cyan-950/45 to-slate-900/75 px-6 py-12 shadow-[0_24px_80px_rgba(8,47,73,0.35)] backdrop-blur-sm md:px-10 md:py-16"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/22 blur-3xl" />
          <div className="absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.16),transparent_38%),radial-gradient(circle_at_60%_80%,rgba(251,191,36,0.12),transparent_35%)]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <p className="font-crimson text-xs font-semibold tracking-[0.35em] text-cyan-100/90 uppercase md:text-sm">
            HackFest&apos;26 Committees
          </p>
          <h1 className="font-pirate text-4xl leading-[0.95] text-white drop-shadow-sm sm:text-5xl md:text-6xl">
            The People Behind HackFest
          </h1>
          <p className="max-w-2xl font-crimson text-base leading-relaxed text-cyan-50/90 md:text-xl">
            A cross-functional team turning bold ideas into a 36-hour innovation
            experience.
          </p>

          <div className="grid gap-3 pt-3 sm:grid-cols-3 md:max-w-3xl">
            <StatChip
              label="Committees"
              value={`${nonEmptyCommittees.length}`}
            />
            <StatChip label="Members" value={`${totalMembers}+`} />
            <StatChip label="Faculty" value={`${facultyData.length}`} />
          </div>
        </div>
      </motion.div>

      <div className="mt-10 inline-flex rounded-full border border-cyan-200/25 bg-slate-950/65 p-1.5 backdrop-blur-sm shadow-[0_10px_24px_rgba(8,47,73,0.25)]">
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
        <div className="mt-9 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none]">
          <FilterChip
            label="All Committees"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          {availableCommitteeNames.map((committee) => (
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
        <div className="mt-10 space-y-10">
          {isLoading ? (
            <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-6 font-crimson text-cyan-50/85 shadow-[0_12px_28px_rgba(15,23,42,0.35)]">
              Loading team members...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-6 font-crimson text-red-100 shadow-[0_12px_28px_rgba(127,29,29,0.25)]">
              {loadError}
            </div>
          ) : visibleCommittees.length === 0 ? (
            <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-6 font-crimson text-cyan-50/85 shadow-[0_12px_28px_rgba(15,23,42,0.35)]">
              No team members found for the selected committee.
            </div>
          ) : (
            visibleCommittees.map((committeeGroup, committeeIndex) => {
              return (
                <motion.section
                  key={committeeGroup.committee}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.35, delay: committeeIndex * 0.05 }}
                  className="space-y-5"
                >
                  <h2 className="font-pirate text-3xl leading-none text-white md:text-[2.1rem]">
                    {committeeGroup.committee}
                  </h2>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {committeeGroup.members.map((member, memberIndex) => (
                      <motion.article
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.3,
                          delay: committeeIndex * 0.04 + memberIndex * 0.03,
                        }}
                        whileHover={{ y: -4 }}
                        className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-cyan-200/20 bg-linear-to-b from-slate-900/92 via-slate-900/75 to-slate-950/85 transition-all duration-300 hover:border-cyan-200/45 hover:shadow-[0_22px_42px_rgba(3,105,161,0.24)]"
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.08)_0%,transparent_32%)]" />

                        <div className="relative h-4/5 w-full overflow-hidden">
                          <img
                            src={member.photo || makeAvatar(member.name)}
                            alt={member.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-950/92 via-slate-950/35 to-transparent" />
                        </div>

                        <div className="flex h-1/5 items-end justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-crimson text-lg leading-tight font-semibold text-white md:text-xl">
                              {member.name}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 font-crimson text-xs leading-relaxed text-cyan-100/75 md:text-sm">
                              {member.role}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <SocialIconLink
                              platform="linkedin"
                              href={member.socialLinks?.linkedin}
                            />
                            <SocialIconLink
                              platform="github"
                              href={member.socialLinks?.github}
                            />
                            <SocialIconLink
                              platform="twitter"
                              href={member.socialLinks?.twitter}
                            />
                            <SocialIconLink
                              platform="instagram"
                              href={member.socialLinks?.instagram}
                            />
                            <SocialIconLink
                              platform="email"
                              href={member.socialLinks?.email}
                            />
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </motion.section>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {facultyData.map((faculty) => {
            return (
              <motion.article
                key={faculty.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35 }}
                className={[
                  "group relative aspect-4/5 overflow-hidden rounded-2xl border transition-all duration-300",
                  "bg-linear-to-b from-slate-900/92 via-slate-900/75 to-slate-950/85 backdrop-blur-md",
                  "border-cyan-200/20 hover:-translate-y-1 hover:border-cyan-200/45 hover:shadow-[0_22px_42px_rgba(3,105,161,0.24)]",
                ].join(" ")}
              >
                <div className="relative h-4/5 w-full overflow-hidden">
                  <img
                    src={faculty.photo}
                    alt={faculty.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-950/92 via-slate-950/35 to-transparent" />
                </div>

                <div className="flex h-1/5 items-end justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-crimson text-lg leading-tight font-semibold text-white md:text-xl">
                      {faculty.name}
                    </h2>
                    <p className="mt-0.5 line-clamp-1 font-crimson text-xs leading-relaxed text-cyan-100/80 md:text-sm">
                      {faculty.designation}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <SocialHandleLink
                      platform="github"
                      handle={faculty.githubHandle}
                    />
                    <SocialHandleLink
                      platform="instagram"
                      handle={faculty.instagramHandle}
                    />
                  </div>
                </div>
              </motion.article>
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
        "h-11 shrink-0 rounded-full border px-4 font-crimson text-sm font-semibold tracking-wide transition-all duration-300",
        "focus:outline-hidden focus:ring-2 focus:ring-cyan-300/60",
        active
          ? "border-cyan-200/80 bg-cyan-200/25 text-white shadow-[0_0_22px_rgba(34,211,238,0.16)]"
          : "border-cyan-100/20 bg-slate-900/60 text-cyan-100/80 hover:border-cyan-100/40 hover:bg-slate-900/75 hover:text-white",
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
        "h-11 rounded-full px-5 font-crimson text-sm font-semibold tracking-wide transition-all duration-300",
        "focus:outline-hidden focus:ring-2 focus:ring-cyan-300/60",
        active
          ? "bg-cyan-200/25 text-white shadow-[0_0_20px_rgba(34,211,238,0.22)]"
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
      <p className="font-crimson text-[11px] font-semibold tracking-[0.24em] text-cyan-100/70 uppercase">
        {label}
      </p>
      <p className="pt-1 font-pirate text-2xl leading-none text-white">
        {value}
      </p>
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
    return null;
  }

  const href = isGithub
    ? `https://github.com/${normalizedHandle}`
    : `https://instagram.com/${normalizedHandle}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-200/25 bg-slate-900/60 text-cyan-50 transition-colors duration-200 hover:border-cyan-200/45 hover:bg-slate-800/70"
      aria-label={`${label} profile of ${normalizedHandle}`}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function SocialIconLink({
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
    return null;
  }

  const finalHref = platform === "email" ? `mailto:${safeHref}` : safeHref;

  return (
    <a
      href={finalHref}
      target={platform === "email" ? undefined : "_blank"}
      rel={platform === "email" ? undefined : "noreferrer"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-200/25 bg-slate-900/60 text-cyan-50 transition-colors duration-200 hover:border-cyan-200/45 hover:bg-slate-800/70"
      aria-label={`${label} link`}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
