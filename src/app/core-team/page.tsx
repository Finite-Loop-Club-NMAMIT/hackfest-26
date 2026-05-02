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

export const dynamic = "force-static";

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

  // Fetch at build / ISR time — no client waterfall
  const [grouped, faculty] = await Promise.all([
    listPublicTeamMembersGrouped(),
    listPublicFacultyMembers(),
  ]);

  const committees = grouped.map((group) => ({
    committee: group.committee,
    members: group.members.map(normalizeTeamMember),
  }));

  const normalizedFaculty = faculty.map(normalizeFacultyMember);

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
