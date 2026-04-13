import "dotenv/config";
import { eq } from "drizzle-orm";
import db from "../src/db/index";
import { selected, teams, participants } from "../src/db/schema";

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function assignTeamNumbers() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE — no database writes will be made.\n");
  }

  // 1. Fetch all selected entries with their team + leader + leader's college
  const selectedEntries = await db
    .select({
      selectedId: selected.id,
      teamId: selected.teamId,
      teamName: teams.name,
      leaderId: teams.leaderId,
      collegeId: participants.collegeId,
    })
    .from(selected)
    .innerJoin(teams, eq(selected.teamId, teams.id))
    .innerJoin(participants, eq(teams.leaderId, participants.id));

  if (selectedEntries.length === 0) {
    console.log("No selected teams found. Exiting.");
    process.exit(0);
  }

  const totalTeams = selectedEntries.length;
  console.log(`Found ${totalTeams} selected teams.\n`);

  // 2. Group teams by college ID
  const collegeGroups = new Map<
    string,
    Array<{ selectedId: string; teamId: string; teamName: string }>
  >();

  for (const entry of selectedEntries) {
    const collegeKey = entry.collegeId ?? "UNKNOWN";
    if (!collegeGroups.has(collegeKey)) {
      collegeGroups.set(collegeKey, []);
    }
    collegeGroups.get(collegeKey)!.push({
      selectedId: entry.selectedId,
      teamId: entry.teamId,
      teamName: entry.teamName,
    });
  }

  console.log(`Teams spread across ${collegeGroups.size} colleges.\n`);

  // Log college distribution
  for (const [collegeId, collegeTeams] of collegeGroups) {
    console.log(
      `  College ${collegeId.slice(0, 8)}…: ${collegeTeams.length} team(s) — ${collegeTeams.map((t) => t.teamName).join(", ")}`,
    );
  }
  console.log();

  // 3. Sort colleges by team count (descending) for offset assignment
  const sortedColleges = [...collegeGroups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  type TeamWithPosition = {
    selectedId: string;
    teamId: string;
    teamName: string;
    collegeId: string;
    idealPos: number;
  };

  const teamPositions: TeamWithPosition[] = [];

  for (let i = 0; i < sortedColleges.length; i++) {
    const [collegeId, collegeTeams] = sortedColleges[i];
    const k = collegeTeams.length;
    const spacing = totalTeams / k;
    const offset = i; // stagger starting position by college index

    // Shuffle teams within each college for randomness
    shuffleArray(collegeTeams);

    for (let j = 0; j < k; j++) {
      teamPositions.push({
        ...collegeTeams[j],
        collegeId,
        idealPos: offset + j * spacing,
      });
    }
  }

  // 5. Sort by ideal position → this is the final ordering
  teamPositions.sort((a, b) => a.idealPos - b.idealPos);

  // 6. Assign team numbers (1-indexed)
  console.log("Assigned team numbers:\n");
  console.log(
    `${"No.".padStart(4)}  ${"Team Name".padEnd(40)}  ${"College".padEnd(12)}  ${"Ideal Pos".padEnd(10)}`,
  );
  console.log("-".repeat(72));

  const updates: Array<{ selectedId: string; teamNo: number }> = [];

  for (let i = 0; i < teamPositions.length; i++) {
    const teamNo = i + 1;
    const team = teamPositions[i];
    updates.push({ selectedId: team.selectedId, teamNo });

    console.log(
      `${String(teamNo).padStart(4)}  ${team.teamName.padEnd(40)}  ${team.collegeId.slice(0, 10).padEnd(12)}  ${team.idealPos.toFixed(1).padEnd(10)}`,
    );
  }

  console.log();

  // 7. Verify spread: show gaps for each college
  console.log("Gap analysis per college:\n");
  const collegePositions = new Map<string, number[]>();
  for (let i = 0; i < teamPositions.length; i++) {
    const cid = teamPositions[i].collegeId;
    if (!collegePositions.has(cid)) {
      collegePositions.set(cid, []);
    }
    collegePositions.get(cid)!.push(i + 1);
  }

  let totalMinGap = Infinity;
  for (const [collegeId, positions] of collegePositions) {
    if (positions.length <= 1) continue;
    const idealGap = Math.round(totalTeams / positions.length);
    const gaps: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      gaps.push(positions[i] - positions[i - 1]);
    }
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    totalMinGap = Math.min(totalMinGap, minGap);
    console.log(
      `  College ${collegeId.slice(0, 8)}…: ${positions.length} teams, positions [${positions.join(", ")}], gaps [${gaps.join(", ")}], ideal gap ~${idealGap}, min ${minGap}, max ${maxGap}`,
    );
  }

  console.log(`\n  Overall minimum gap: ${totalMinGap}\n`);

  // 8. Write to database
  if (dryRun) {
    console.log(
      "🔍 DRY RUN — skipping database update. Run without --dry-run to apply.\n",
    );
  } else {
    console.log("Writing team numbers to database...\n");

    for (const update of updates) {
      await db
        .update(selected)
        .set({ teamNo: update.teamNo })
        .where(eq(selected.id, update.selectedId));
    }

    console.log(
      `✅ Successfully assigned team numbers to ${updates.length} teams.\n`,
    );
  }
}

assignTeamNumbers()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
