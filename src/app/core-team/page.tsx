import type { Metadata } from "next";
import { auth } from "~/auth/config";
import Footer from "~/components/landing/Footer";
import { Navbar } from "~/components/landing/Navbar";
import CommitteesShowcase from "~/components/teams/committees-showcase";
import {
  listPublicTeamMembersGrouped,
  normalizeTeamMember,
} from "~/db/services/team-member-services";
import {
  listPublicFacultyMembers,
  normalizeFacultyMember,
} from "~/db/services/faculty-services";
import type { TeamCommittee } from "~/lib/constants/team-committees";

// ISR — generated on first request, cached for 1 hour.
// Cannot use force-static because the DB isn't reachable at Docker build time.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Core Team",
  description:
    "Meet the organising committee behind Hackfest'26 – the team making the 36-hour national hackathon at NMAMIT, Nitte happen.",
  alternates: {
    canonical: "https://hackfest.dev/core-team",
  },
};

export default async function CoreTeamPage() {
  const session = await auth();

  // Fetch at ISR time — no client waterfall
  let committees: { committee: TeamCommittee; members: ReturnType<typeof normalizeTeamMember>[] }[] = [];
  let normalizedFaculty: ReturnType<typeof normalizeFacultyMember>[] = [];

  try {
    const [grouped, faculty] = await Promise.all([
      listPublicTeamMembersGrouped(),
      listPublicFacultyMembers(),
    ]);

    committees = grouped.map((group) => ({
      committee: group.committee,
      members: group.members.map(normalizeTeamMember),
    }));

    normalizedFaculty = faculty.map(normalizeFacultyMember);
  } catch (error) {
    console.error("[core-team] Failed to fetch team data:", error);
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-white selection:bg-cyan-500/30">
      <div className="fixed top-0 left-0 z-50 w-full">
        <Navbar isUnderwater={true} session={session} />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-[#041320] via-[#062739] to-[#020b14]" />

      <CommitteesShowcase
        initialCommittees={committees}
        initialFaculty={normalizedFaculty}
      />
      <Footer />
    </main>
  );
}
