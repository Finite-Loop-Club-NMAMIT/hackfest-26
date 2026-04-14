import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import db from "~/db";
import {
  colleges,
  dormitory,
  lab,
  participants,
  selected,
  teams,
} from "~/db/schema";

export type TeamGender = "Male" | "Female" | "Prefer Not To Say" | "Mixed" | "Unknown";

function resolveTeamGender(counts: {
  Male: number;
  Female: number;
  "Prefer Not To Say": number;
}): TeamGender {
  const kinds: string[] = [];
  if (counts.Male > 0) kinds.push("Male");
  if (counts.Female > 0) kinds.push("Female");
  if (counts["Prefer Not To Say"] > 0) kinds.push("Prefer Not To Say");
  if (kinds.length === 0) return "Unknown";
  if (kinds.length === 1) return kinds[0] as TeamGender;
  return "Mixed";
}

export async function getSelectedTeamsForAllocation() {
  const rows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      teamNo: selected.teamNo,
      collegeName: colleges.name,
      memberCount: sql`count(${participants.id})`.mapWith(Number),
    })
    .from(selected)
    .innerJoin(teams, eq(teams.id, selected.teamId))
    .leftJoin(participants, eq(participants.teamId, teams.id))
    .leftJoin(colleges, eq(colleges.id, participants.collegeId))
    .groupBy(teams.id, teams.name, selected.teamNo, colleges.name)
    .orderBy(selected.teamNo);

  if (rows.length === 0) return [];

  const teamIds = rows.map((r) => r.teamId);

  const genderRows = await db
    .select({
      teamId: participants.teamId,
      gender: participants.gender,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(participants)
    .where(
      and(isNotNull(participants.teamId), inArray(participants.teamId, teamIds)),
    )
    .groupBy(participants.teamId, participants.gender);

  const genderMap = new Map<
    string,
    { Male: number; Female: number; "Prefer Not To Say": number }
  >();
  for (const g of genderRows) {
    if (!g.teamId) continue;
    if (!genderMap.has(g.teamId)) {
      genderMap.set(g.teamId, { Male: 0, Female: 0, "Prefer Not To Say": 0 });
    }
    const entry = genderMap.get(g.teamId)!;
    if (
      g.gender === "Male" ||
      g.gender === "Female" ||
      g.gender === "Prefer Not To Say"
    ) {
      entry[g.gender] += g.count;
    }
  }

  const dormRows = await db
    .select({
      teamId: participants.teamId,
      gender: participants.gender,
      dormId: participants.dormitoryId,
      dormName: dormitory.name,
    })
    .from(participants)
    .innerJoin(dormitory, sql`${dormitory.id}::text = ${participants.dormitoryId}`)
    .where(
      and(isNotNull(participants.teamId), inArray(participants.teamId, teamIds), isNotNull(participants.dormitoryId)),
    )
    .groupBy(participants.teamId, participants.gender, participants.dormitoryId, dormitory.name);

  const dormMap = new Map<string, Record<string, { dormId: string; dormName: string }>>();
  for (const d of dormRows) {
    if (!d.teamId || !d.gender || !d.dormId) continue;
    if (!dormMap.has(d.teamId)) dormMap.set(d.teamId, {});
    dormMap.get(d.teamId)![d.gender] = { dormId: d.dormId, dormName: d.dormName };
  }

  return rows.map((r) => {
    const counts = genderMap.get(r.teamId) ?? {
      Male: 0,
      Female: 0,
      "Prefer Not To Say": 0,
    };
    const teamGender = resolveTeamGender(counts);
    const assignments = dormMap.get(r.teamId) ?? {};

    return {
      ...r,
      genderCounts: counts,
      teamGender,
      assignedDormId: teamGender !== "Mixed" ? (Object.values(assignments)[0]?.dormId ?? null) : null,
      assignedDormName: teamGender !== "Mixed" ? (Object.values(assignments)[0]?.dormName ?? null) : null,
      maleDormId: assignments.Male?.dormId ?? null,
      maleDormName: assignments.Male?.dormName ?? null,
      femaleDormId: assignments.Female?.dormId ?? null,
      femaleDormName: assignments.Female?.dormName ?? null,
    };
  });
}

export async function listDormsWithOccupancy() {
  const dorms = await db.select().from(dormitory);

  if (dorms.length === 0) return [];

  const occupancyRows = await db
    .select({
      dormId: participants.dormitoryId,
      teamCount: sql`count(distinct ${participants.teamId})`.mapWith(Number),
      participantCount: sql`count(${participants.id})`.mapWith(Number),
    })
    .from(participants)
    .where(isNotNull(participants.dormitoryId))
    .groupBy(participants.dormitoryId);

  const occMap = new Map(occupancyRows.map((r) => [r.dormId, r]));

  return dorms.map((d) => {
    const occ = occMap.get(d.id);
    return {
      ...d,
      teamCount: occ?.teamCount ?? 0,
      participantCount: occ?.participantCount ?? 0,
    };
  });
}

export async function createDorm(
  name: string,
  gender: "Male" | "Female" | "Prefer Not To Say",
) {
  const [dorm] = await db
    .insert(dormitory)
    .values({ name, gender })
    .returning();
  return dorm;
}

export async function deleteDorm(id: string) {
  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(participants)
    .where(eq(participants.dormitoryId, id));

  if (count > 0) {
    throw new Error(
      `Cannot delete dorm: ${count} participant(s) are currently assigned.`,
    );
  }

  const [deleted] = await db
    .delete(dormitory)
    .where(eq(dormitory.id, id))
    .returning();
  return deleted;
}

export async function getDormTeams(dormId: string) {
  const rows = await db
    .select({
      teamId: participants.teamId,
      teamName: teams.name,
      teamNo: selected.teamNo,
      memberCount: sql`count(${participants.id})`.mapWith(Number),
    })
    .from(participants)
    .innerJoin(teams, eq(teams.id, participants.teamId))
    .leftJoin(selected, eq(selected.teamId, teams.id))
    .where(
      and(
        eq(participants.dormitoryId, dormId),
        isNotNull(participants.teamId),
      ),
    )
    .groupBy(participants.teamId, teams.name, selected.teamNo)
    .orderBy(selected.teamNo);

  const teamIds = rows.map((r) => r.teamId).filter(Boolean) as string[];
  let membersByTeam = new Map<string, { id: string; name: string | null; gender: string | null }[]>();

  if (teamIds.length > 0) {
    const memberRows = await db
      .select({
        id: participants.id,
        teamId: participants.teamId,
        name: participants.name,
        gender: participants.gender,
      })
      .from(participants)
      .where(and(
        isNotNull(participants.teamId),
        inArray(participants.teamId, teamIds),
        eq(participants.dormitoryId, dormId),
      ));

    for (const m of memberRows) {
      if (!m.teamId) continue;
      const list = membersByTeam.get(m.teamId) ?? [];
      list.push({ id: m.id, name: m.name, gender: m.gender });
      membersByTeam.set(m.teamId, list);
    }
  }

  return rows.map((r) => ({
    ...r,
    members: r.teamId ? (membersByTeam.get(r.teamId) ?? []) : [],
  }));
}

export async function assignTeamToDorm(teamId: string, dormId: string) {
  await db
    .update(participants)
    .set({ dormitoryId: dormId })
    .where(eq(participants.teamId, teamId));
}

export async function unassignTeamFromDorm(teamId: string) {
  await db
    .update(participants)
    .set({ dormitoryId: null })
    .where(eq(participants.teamId, teamId));
}

export async function assignTeamMembersByGenderToDorm(teamId: string, gender: string, dormId: string) {
  await db
    .update(participants)
    .set({ dormitoryId: dormId })
    .where(and(eq(participants.teamId, teamId), sql`${participants.gender}::text = ${gender}`));
}

export async function unassignTeamMembersByGender(teamId: string, gender: string) {
  await db
    .update(participants)
    .set({ dormitoryId: null })
    .where(and(eq(participants.teamId, teamId), sql`${participants.gender}::text = ${gender}`));
}

export async function autoAssignDorms() {
  const allTeams = await getSelectedTeamsForAllocation();
  const allDorms = await listDormsWithOccupancy();

  const dormsByGender = new Map<string, typeof allDorms>();
  for (const d of allDorms) {
    const list = dormsByGender.get(d.gender) ?? [];
    list.push(d);
    dormsByGender.set(d.gender, list);
  }

  const occupancy = new Map(allDorms.map((d) => [d.id, d.participantCount]));

  let assigned = 0;
  let notAssigned = 0;
  const notAssignableTeams: string[] = [];

  await db.update(participants).set({ dormitoryId: null }).where(isNotNull(participants.dormitoryId));

  for (const team of allTeams) {
    if (team.teamGender === "Mixed" || team.teamGender === "Unknown") {
      notAssigned++;
      notAssignableTeams.push(team.teamName);
      continue;
    }

    const compatibleDorms = dormsByGender.get(team.teamGender) ?? [];
    if (compatibleDorms.length === 0) {
      notAssigned++;
      notAssignableTeams.push(team.teamName);
      continue;
    }

    compatibleDorms.sort(
      (a, b) => (occupancy.get(a.id) ?? 0) - (occupancy.get(b.id) ?? 0),
    );
    const targetDorm = compatibleDorms[0];

    await db
      .update(participants)
      .set({ dormitoryId: targetDorm.id })
      .where(eq(participants.teamId, team.teamId));

    occupancy.set(
      targetDorm.id,
      (occupancy.get(targetDorm.id) ?? 0) + team.memberCount,
    );
    assigned++;
  }

  return { assigned, notAssigned, notAssignableTeams };
}

export async function listLabs() {
  return db.select().from(lab);
}

export async function createLab(name: string, capacity: number) {
  const [newLab] = await db.insert(lab).values({ name, capacity }).returning();
  return newLab;
}

export async function deleteLab(id: string) {
  const [deleted] = await db.delete(lab).where(eq(lab.id, id)).returning();
  return deleted;
}
