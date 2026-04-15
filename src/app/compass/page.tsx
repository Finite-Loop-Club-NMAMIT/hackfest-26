import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import db from "~/db";
import { participants, selected, teams } from "~/db/schema";
import { CompassClient } from "./ui";

export default async function CompassPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/compass");

  const me = (
    await db
      .select({ teamId: participants.teamId })
      .from(participants)
      .where(eq(participants.id, session.user.id))
      .limit(1)
  )[0];

  if (!me?.teamId) redirect("/teams");

  const team = (
    await db
      .select({
        id: teams.id,
        name: teams.name,
        stage: teams.teamStage,
        labId: teams.labId,
      })
      .from(teams)
      .where(eq(teams.id, me.teamId))
      .limit(1)
  )[0];

  if (!team) redirect("/teams");

  const selectedEntry = (
    await db
      .select({ teamNo: selected.teamNo })
      .from(selected)
      .where(eq(selected.teamId, team.id))
      .limit(1)
  )[0];

  const isSelected = team.stage === "SELECTED" || !!selectedEntry;
  if (!isSelected) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0e2b56] px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#6f9de0]/55 bg-[#284a86]/55 p-6 text-center text-[#eef6ff]">
          <h1 className="font-pirate text-2xl">You don't have access.</h1>
          <Link
            href={`/teams/${team.id}`}
            className="mt-5 inline-flex rounded-lg border border-[#87b7ff]/45 bg-[#1a3c72]/45 px-4 py-2 text-sm"
          >
            Back to Team
          </Link>
        </div>
      </main>
    );
  }

  const genderCounts = await db
    .select({ gender: participants.gender, total: count() })
    .from(participants)
    .where(eq(participants.teamId, team.id))
    .groupBy(participants.gender);

  const maleCount = genderCounts.find((g) => g.gender === "Male")?.total ?? 0;
  const femaleCount =
    genderCounts.find((g) => g.gender === "Female")?.total ?? 0;

  return (
    <CompassClient
      teamId={team.id}
      teamName={team.name}
      teamNo={selectedEntry?.teamNo ?? null}
      maleCount={maleCount}
      femaleCount={femaleCount}
      labAssignment={"Lab TBA"}
      announcementText="Announcement will be shown here. Stay tuned for updates."
      dormNote="Dorm assignment depends on final allocation and check-in confirmation."
    />
  );
}
