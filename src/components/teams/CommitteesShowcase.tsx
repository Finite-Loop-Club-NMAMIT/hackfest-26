"use client";

import { Github, Instagram } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CommitteeMember = {
  name: string;
  role: string;
  photo: string;
  githubHandle?: string;
  instagramHandle?: string;
};

type Committee = {
  id: string;
  name: string;
  icon: string;
  description: string;
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

// Centralized data model for all committees and members.
const teamsData: Committee[] = [
  {
    id: "organising",
    name: "Organising Committee",
    icon: "🏆",
    description:
      "The backbone of HackFest - planning and executing the vision.",
    members: [
      {
        name: "Aarav Kulkarni",
        role: "Chairperson",
        photo: makeAvatar("Aarav Kulkarni"),
        githubHandle: "aaravk",
        instagramHandle: "aarav.k",
      },
      {
        name: "Isha Bhat",
        role: "Co-Lead",
        photo: makeAvatar("Isha Bhat"),
        githubHandle: "ishabhat",
        instagramHandle: "isha.bhat",
      },
      {
        name: "Rohan Shenoy",
        role: "Member",
        photo: makeAvatar("Rohan Shenoy"),
        githubHandle: "rohanshenoy",
        instagramHandle: "rohan.shenoy",
      },
      {
        name: "Mira Dsouza",
        role: "Member",
        photo: makeAvatar("Mira Dsouza"),
        githubHandle: "miradsouza",
        instagramHandle: "mira.dsouza",
      },
    ],
  },
  {
    id: "technical",
    name: "Technical Committee",
    icon: "💻",
    description:
      "Builds and maintains the platform, infra, and judging systems.",
    members: [
      { name: "Nikhil Rao", role: "Head", photo: makeAvatar("Nikhil Rao") },
      { name: "Shreya Pai", role: "Co-Lead", photo: makeAvatar("Shreya Pai") },
      {
        name: "Aditya Menon",
        role: "Member",
        photo: makeAvatar("Aditya Menon"),
      },
      { name: "Sara Lobo", role: "Member", photo: makeAvatar("Sara Lobo") },
    ],
  },
  {
    id: "sponsorship",
    name: "Sponsorship Committee",
    icon: "🤝",
    description: "Secures partnerships and sponsorships to power HackFest.",
    members: [
      {
        name: "Vihaan Shetty",
        role: "Head",
        photo: makeAvatar("Vihaan Shetty"),
      },
      {
        name: "Aditi Kamath",
        role: "Co-Lead",
        photo: makeAvatar("Aditi Kamath"),
      },
      {
        name: "Kiran Acharya",
        role: "Member",
        photo: makeAvatar("Kiran Acharya"),
      },
      { name: "Tanvi S", role: "Member", photo: makeAvatar("Tanvi S") },
    ],
  },
  {
    id: "social-media-media",
    name: "Social Media & Media Committee",
    icon: "📸",
    description: "Drives storytelling, outreach, and real-time event coverage.",
    members: [
      { name: "Pranav G", role: "Head", photo: makeAvatar("Pranav G") },
      { name: "Keerthi N", role: "Co-Lead", photo: makeAvatar("Keerthi N") },
      { name: "Rahul D", role: "Member", photo: makeAvatar("Rahul D") },
      { name: "Megha P", role: "Member", photo: makeAvatar("Megha P") },
    ],
  },
  {
    id: "digital",
    name: "Digital Committee",
    icon: "🌐",
    description: "Owns digital assets, branding touchpoints, and web presence.",
    members: [
      { name: "Devika M", role: "Head", photo: makeAvatar("Devika M") },
      { name: "Yash K", role: "Co-Lead", photo: makeAvatar("Yash K") },
      { name: "Ananya R", role: "Member", photo: makeAvatar("Ananya R") },
      { name: "Joel F", role: "Member", photo: makeAvatar("Joel F") },
    ],
  },
  {
    id: "documentation",
    name: "Documentation Committee",
    icon: "📝",
    description: "Captures process docs, reports, and institutional knowledge.",
    members: [
      { name: "Saanvi H", role: "Head", photo: makeAvatar("Saanvi H") },
      { name: "Neil T", role: "Co-Lead", photo: makeAvatar("Neil T") },
      { name: "Irene L", role: "Member", photo: makeAvatar("Irene L") },
      { name: "Harsh V", role: "Member", photo: makeAvatar("Harsh V") },
    ],
  },
  {
    id: "publicity",
    name: "Publicity Committee",
    icon: "📣",
    description: "Amplifies HackFest through campaigns, posters, and outreach.",
    members: [
      { name: "Akash P", role: "Head", photo: makeAvatar("Akash P") },
      { name: "Ritika J", role: "Co-Lead", photo: makeAvatar("Ritika J") },
      { name: "Milan S", role: "Member", photo: makeAvatar("Milan S") },
      { name: "Preethi B", role: "Member", photo: makeAvatar("Preethi B") },
    ],
  },
  {
    id: "operations",
    name: "Operations Committee",
    icon: "⚙️",
    description: "Handles logistics, resources, and on-ground coordination.",
    members: [
      { name: "Karthik U", role: "Head", photo: makeAvatar("Karthik U") },
      { name: "Naina R", role: "Co-Lead", photo: makeAvatar("Naina R") },
      { name: "Soham K", role: "Member", photo: makeAvatar("Soham K") },
      { name: "Janvi A", role: "Member", photo: makeAvatar("Janvi A") },
    ],
  },
  {
    id: "event-management",
    name: "Event Management Committee",
    icon: "🎯",
    description:
      "Designs participant experience from kickoff to final showcase.",
    members: [
      { name: "Rishi N", role: "Head", photo: makeAvatar("Rishi N") },
      { name: "Diya S", role: "Co-Lead", photo: makeAvatar("Diya S") },
      { name: "Tejas M", role: "Member", photo: makeAvatar("Tejas M") },
      { name: "Ayesha Q", role: "Member", photo: makeAvatar("Ayesha Q") },
    ],
  },
  {
    id: "crew",
    name: "Crew Committee",
    icon: "🚀",
    description:
      "The rapid-response force that keeps every moment running smooth.",
    members: [
      { name: "Omkar C", role: "Head", photo: makeAvatar("Omkar C") },
      { name: "Pooja K", role: "Co-Lead", photo: makeAvatar("Pooja K") },
      { name: "Farhan I", role: "Member", photo: makeAvatar("Farhan I") },
      { name: "Nivedita D", role: "Member", photo: makeAvatar("Nivedita D") },
    ],
  },
];

// Add or update faculty coordinator cards here.
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

type RevealItem = {
  id: string;
  visible: boolean;
};

export default function CommitteesShowcase() {
  const [activeSection, setActiveSection] = useState<"core" | "faculty">(
    "core",
  );
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeCommittee, setActiveCommittee] = useState<Committee | null>(
    null,
  );
  const [reveals, setReveals] = useState<Record<string, RevealItem>>({});
  const totalMembers = useMemo(
    () =>
      teamsData.reduce(
        (count, committee) => count + committee.members.length,
        0,
      ),
    [],
  );

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(
      "[data-committee-card]",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cardId = entry.target.getAttribute("data-committee-id");
          if (!cardId) continue;

          if (entry.isIntersecting) {
            setReveals((prev) => ({
              ...prev,
              [cardId]: { id: cardId, visible: true },
            }));
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    for (const card of cards) {
      observer.observe(card);
    }

    return () => observer.disconnect();
  }, [activeSection, query, activeFilter]);

  const filteredCommittees = teamsData.filter((committee) => {
    const matchesQuery =
      committee.name.toLowerCase().includes(query.toLowerCase()) ||
      committee.description.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || activeFilter === committee.id;

    return matchesQuery && matchesFilter;
  });

  const filteredFaculty = facultyData.filter((faculty) => {
    return (
      faculty.name.toLowerCase().includes(query.toLowerCase()) ||
      faculty.designation.toLowerCase().includes(query.toLowerCase()) ||
      faculty.department.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8 lg:pt-32">
      {/* Hero section */}
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
            <StatChip label="Committees" value={`${teamsData.length}`} />
            <StatChip label="Members" value={`${totalMembers}+`} />
            <StatChip label="Faculty" value={`${facultyData.length}`} />
          </div>
        </div>
      </div>

      {/* Main section tabs */}
      <div className="mt-8 inline-flex rounded-full border border-cyan-200/25 bg-slate-900/60 p-1 backdrop-blur-sm">
        <SectionTab
          label="Core Team"
          active={activeSection === "core"}
          onClick={() => {
            setActiveSection("core");
            setActiveCommittee(null);
          }}
        />
        <SectionTab
          label="Faculty"
          active={activeSection === "faculty"}
          onClick={() => {
            setActiveSection("faculty");
            setActiveCommittee(null);
          }}
        />
      </div>

      {/* Search and filter controls */}
      <div className="mt-10 space-y-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            activeSection === "core"
              ? "Search committees"
              : "Search faculty coordinators"
          }
          className="h-12 w-full rounded-xl border border-cyan-200/25 bg-slate-950/60 px-4 font-crimson text-base text-cyan-50 placeholder:text-cyan-50/50 outline-hidden transition-all duration-300 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
          aria-label={
            activeSection === "core"
              ? "Search committees"
              : "Search faculty coordinators"
          }
        />

        {activeSection === "core" ? (
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            <FilterChip
              label="All Committees"
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            />
            {teamsData.map((committee) => (
              <FilterChip
                key={committee.id}
                label={committee.name}
                active={activeFilter === committee.id}
                onClick={() => setActiveFilter(committee.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Main section content */}
      {activeSection === "core" ? (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommittees.map((committee, index) => {
            const cardVisible = reveals[committee.id]?.visible;
            const isActive = activeCommittee?.id === committee.id;

            return (
              <article
                key={committee.id}
                data-committee-card
                data-committee-id={committee.id}
                className={[
                  "group relative flex min-h-63.75 flex-col rounded-2xl border p-6 transition-all duration-500",
                  "bg-linear-to-b from-slate-900/85 via-slate-900/70 to-slate-950/70 backdrop-blur-md",
                  isActive
                    ? "border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.35)]"
                    : "border-cyan-200/20 hover:border-cyan-200/45",
                  cardVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0",
                ].join(" ")}
                style={{ transitionDelay: `${Math.min(index * 80, 500)}ms` }}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-100/25 bg-cyan-300/10 text-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  <span aria-hidden>{committee.icon}</span>
                </div>

                <h2 className="font-pirate text-2xl leading-tight text-white">
                  {committee.name}
                </h2>
                <p className="mt-3 font-crimson text-lg text-cyan-50/80">
                  {committee.description}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveCommittee(committee)}
                  className="mt-auto inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-amber-200/40 bg-amber-100/10 px-4 font-crimson text-base font-semibold text-amber-100 transition-all duration-300 hover:border-amber-200/70 hover:bg-amber-200/20 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-300/60"
                >
                  Meet the Team
                  <span aria-hidden>→</span>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredFaculty.map((faculty, index) => {
            const cardId = `faculty-${faculty.id}`;
            const cardVisible = reveals[cardId]?.visible;

            return (
              <article
                key={faculty.id}
                data-committee-card
                data-committee-id={cardId}
                className={[
                  "group relative flex min-h-80 flex-col rounded-2xl border p-6 transition-all duration-500",
                  "bg-linear-to-b from-slate-900/85 via-slate-900/70 to-slate-950/70 backdrop-blur-md",
                  "border-cyan-200/20 hover:border-cyan-200/45",
                  cardVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0",
                ].join(" ")}
                style={{ transitionDelay: `${Math.min(index * 80, 500)}ms` }}
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

      {/* Member modal */}
      <MemberModal
        committee={activeCommittee}
        onClose={() => setActiveCommittee(null)}
      />
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

function MemberModal({
  committee,
  onClose,
}: {
  committee: Committee | null;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (committee) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = "";
    setIsVisible(false);
  }, [committee]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  if (!committee) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-80 flex items-end justify-center bg-slate-950/75 pb-0 pt-24 backdrop-blur-sm sm:items-start sm:p-4 sm:pt-28",
        "transition-opacity duration-350",
        isVisible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={`${committee.name} members`}
    >
      <div
        className={[
          "relative h-[calc(100dvh-6rem)] w-full overflow-y-auto border border-cyan-200/30 bg-linear-to-b from-slate-900 via-slate-950 to-slate-950 p-5",
          "transition-transform duration-350 sm:h-auto sm:max-h-[calc(100dvh-8rem)] sm:max-w-4xl sm:rounded-2xl sm:p-8",
          isVisible ? "translate-y-0" : "translate-y-10",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-crimson text-sm tracking-[0.2em] text-cyan-100/75 uppercase">
              {committee.icon} Committee Members
            </p>
            <h3 className="pt-1 font-pirate text-3xl text-white">
              {committee.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-11 min-w-11 rounded-lg border border-cyan-200/35 bg-cyan-200/10 px-3 text-cyan-50 transition-colors hover:bg-cyan-200/20 focus:outline-hidden focus:ring-2 focus:ring-cyan-300/60"
            aria-label="Close members modal"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {committee.members.map((member) => (
            <article
              key={`${committee.id}-${member.name}`}
              className="flex min-h-96 flex-col rounded-xl border border-cyan-200/20 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/45 hover:shadow-[0_16px_32px_rgba(3,105,161,0.25)]"
            >
              <div className="mx-auto mb-4 aspect-square w-full max-w-65 overflow-hidden rounded-xl border-2 border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.45)] sm:max-w-75">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <h4 className="text-center font-crimson text-2xl font-bold text-white">
                {member.name}
              </h4>
              <p className="text-center font-crimson text-base text-cyan-100/75">
                {member.role}
              </p>

              <div className="mt-auto pt-4 grid gap-2">
                <SocialHandleLink
                  platform="github"
                  handle={member.githubHandle}
                />
                <SocialHandleLink
                  platform="instagram"
                  handle={member.instagramHandle}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
