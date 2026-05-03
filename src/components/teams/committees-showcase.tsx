"use client";

import { Github, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { TeamCommittee } from "~/lib/constants/team-committees";

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

type FacultyMember = {
  id: string;
  name: string;
  designation: string;
  department: string;
  photo: string | null;
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

const makeAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff&bold=true`;

/* ------------------------------------------------------------------ */
/*  Shared social-link icon row                                       */
/* ------------------------------------------------------------------ */
function SocialRow({
  links,
}: {
  links?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    email?: string;
  };
}) {
  if (!links) return null;
  const entries = [
    { platform: "linkedin" as const, href: links.linkedin },
    { platform: "github" as const, href: links.github },
    { platform: "twitter" as const, href: links.twitter },
    { platform: "instagram" as const, href: links.instagram },
    { platform: "email" as const, href: links.email },
  ].filter((e) => e.href?.trim());

  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {entries.map((e) => (
        <SocialIconLink key={e.platform} platform={e.platform} href={e.href} />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */
export default function CommitteesShowcase({
  initialCommittees,
  initialFaculty,
}: {
  initialCommittees: CommitteePayload[];
  initialFaculty: FacultyMember[];
}) {
  const [activeSection, setActiveSection] = useState<"core" | "faculty">(
    "core",
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Data is passed from the server — no client-side fetching needed
  const committeeGroups = initialCommittees;
  const facultyMembers = initialFaculty;

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
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-55">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_86%_16%,rgba(251,191,36,0.14),transparent_36%),radial-gradient(circle_at_50%_90%,rgba(6,182,212,0.13),transparent_35%)]" />
      </div>

      {/* ── HERO BANNER ── */}
      <div
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
            <StatChip label="Faculty" value={`${facultyMembers.length}`} />
          </div>
        </div>
      </div>

      {/* ── SECTION TOGGLE (Core / Faculty) ── */}
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

      {/* ── COMMITTEE FILTER CHIPS ── */}
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

      {/* ── CORE TEAM CARDS ── */}
      {activeSection === "core" ? (
        <div className="mt-10 space-y-14">
          {visibleCommittees.length === 0 ? (
            <EmptyCard text="No team members found for the selected committee." />
          ) : (
            visibleCommittees.map((committeeGroup, ci) => (
              <section
                key={committeeGroup.committee}
                className="space-y-6"
              >
                {/* Committee heading */}
                <div className="flex items-center gap-4">
                  <h2 className="font-pirate text-3xl leading-none text-white md:text-[2.1rem]">
                    {committeeGroup.committee}
                  </h2>
                  <div className="h-px grow bg-gradient-to-r from-cyan-400/40 to-transparent" />
                  <span className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-950/50 px-3 py-1 font-crimson text-xs font-semibold text-cyan-300/90">
                    {committeeGroup.members.length}{" "}
                    {committeeGroup.members.length === 1
                      ? "member"
                      : "members"}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {committeeGroup.members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                      />
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : /* ── FACULTY CARDS ── */
      facultyMembers.length === 0 ? (
        <div className="mt-10">
          <EmptyCard text="No faculty members found." />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {facultyMembers.map((faculty) => (
              <FacultyCard key={faculty.id} faculty={faculty} />
            ))}
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/*  MEMBER CARD — premium redesign                                    */
/* ================================================================== */
function MemberCard({
  member,
}: {
  member: CommitteeMember;
}) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(15,23,42,0.92)_0%,rgba(8,47,73,0.55)_50%,rgba(15,23,42,0.92)_100%)] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.22)]"
    >
      {/* ── Animated border glow on hover ── */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(from_230deg,transparent_60%,rgba(6,182,212,0.25)_78%,rgba(34,211,238,0.35)_85%,transparent_95%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      {/* Inner background to sit over the conic border */}
      <div className="pointer-events-none absolute inset-px rounded-[15px] bg-[linear-gradient(160deg,rgba(15,23,42,0.98)_0%,rgba(8,47,73,0.65)_50%,rgba(15,23,42,0.98)_100%)]" />

      {/* ── PHOTO ── */}
      <div className="relative z-[1] mx-3 mt-3 overflow-hidden rounded-xl aspect-square">
        <Image
          src={member.photo || makeAvatar(member.name)}
          alt={member.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
        />
        {/* Photo gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        {/* Subtle top-left highlight */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
      </div>

      {/* ── INFO SECTION ── */}
      <div className="relative z-[1] flex grow flex-col px-4 pb-4 pt-3.5">
        {/* Role badge — the star of the show */}
        <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/25 bg-cyan-500/[0.12] px-3 py-1 font-crimson text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.12)] transition-all duration-500 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/[0.18] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.22)] group-hover:text-cyan-200">
          {member.role}
        </span>

        {/* Name */}
        <h3 className="mt-2.5 font-pirate text-[1.15rem] leading-tight text-white/95 transition-colors duration-300 group-hover:text-white">
          {member.name}
        </h3>

        {/* Divider */}
        <div className="my-3 h-px w-full bg-gradient-to-r from-cyan-400/20 via-cyan-400/10 to-transparent" />

        {/* Social links */}
        <SocialRow links={member.socialLinks} />
      </div>
    </article>
  );
}

/* ================================================================== */
/*  FACULTY CARD                                                      */
/* ================================================================== */
function FacultyCard({
  faculty,
}: {
  faculty: FacultyMember;
}) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(15,23,42,0.92)_0%,rgba(8,47,73,0.55)_50%,rgba(15,23,42,0.92)_100%)] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.22)]"
    >
      {/* Animated border glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(from_230deg,transparent_60%,rgba(6,182,212,0.25)_78%,rgba(34,211,238,0.35)_85%,transparent_95%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-px rounded-[15px] bg-[linear-gradient(160deg,rgba(15,23,42,0.98)_0%,rgba(8,47,73,0.65)_50%,rgba(15,23,42,0.98)_100%)]" />

      {/* Photo */}
      <div className="relative z-[1] mx-3 mt-3 overflow-hidden rounded-xl aspect-square">
        <Image
          src={faculty.photo || makeAvatar(faculty.name)}
          alt={faculty.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
      </div>

      {/* Info */}
      <div className="relative z-[1] flex grow flex-col px-4 pb-4 pt-3.5">
        {/* Designation badge */}
        <span className="inline-flex w-fit items-center rounded-full border border-amber-400/25 bg-amber-500/[0.1] px-3 py-1 font-crimson text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.1)] transition-all duration-500 group-hover:border-amber-400/40 group-hover:bg-amber-500/[0.16] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] group-hover:text-amber-200">
          {faculty.designation}
        </span>

        {/* Name */}
        <h2 className="mt-2.5 font-pirate text-[1.15rem] leading-tight text-white/95 transition-colors duration-300 group-hover:text-white">
          {faculty.name}
        </h2>

        {/* Department */}
        <p className="mt-1 font-crimson text-xs leading-relaxed text-cyan-100/55">
          {faculty.department}
        </p>

        {/* Divider */}
        <div className="my-3 h-px w-full bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent" />

        {/* Social links */}
        <SocialRow links={faculty.socialLinks} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  UI helper sub-components                                          */
/* ------------------------------------------------------------------ */

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-6 font-crimson text-cyan-50/85 shadow-[0_12px_28px_rgba(15,23,42,0.35)]">
      {text}
    </div>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-cyan-100/50 transition-all duration-300 hover:border-cyan-400/35 hover:bg-cyan-400/[0.12] hover:text-cyan-200 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]"
      aria-label={`${label} link`}
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}
