import { and, asc, eq } from "drizzle-orm";
import db from "~/db";
import { teamMembers } from "~/db/schema";
import {
  TEAM_COMMITTEES,
  type TeamCommittee,
} from "~/lib/constants/team-committees";
import { AppError } from "~/lib/errors/app-error";
import {
  type CreateTeamMemberInput,
  type UpdateTeamMemberInput,
  createTeamMemberSchema,
  updateTeamMemberSchema,
} from "~/lib/validation/team-member";

type TeamMemberRow = typeof teamMembers.$inferSelect;

export async function listAllTeamMembers() {
  return db
    .select()
    .from(teamMembers)
    .orderBy(
      asc(teamMembers.committee),
      asc(teamMembers.order),
      asc(teamMembers.name),
    );
}

export async function listPublicTeamMembersGrouped() {
  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(
      asc(teamMembers.committee),
      asc(teamMembers.order),
      asc(teamMembers.name),
    );

  return TEAM_COMMITTEES.map((committee) => ({
    committee,
    members: members.filter((member) => member.committee === committee),
  }));
}

export async function findTeamMemberById(id: string) {
  const member = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.id, id),
  });

  if (!member) {
    throw new AppError("TEAM_MEMBER_NOT_FOUND", 404, {
      title: "Member not found",
      description: "The selected team member does not exist.",
    });
  }

  return member;
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  const payload = createTeamMemberSchema.parse(input);

  const [created] = await db
    .insert(teamMembers)
    .values({
      ...payload,
      socialLinks: payload.socialLinks ?? {},
    })
    .returning();

  return created;
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
) {
  const payload = updateTeamMemberSchema.parse(input);
  const existing = await findTeamMemberById(id);

  const [updated] = await db
    .update(teamMembers)
    .set(payload)
    .where(eq(teamMembers.id, id))
    .returning();

  if (!updated) {
    return existing;
  }

  return updated;
}

export async function deleteTeamMember(id: string) {
  const existing = await findTeamMemberById(id);

  const [deleted] = await db
    .delete(teamMembers)
    .where(eq(teamMembers.id, id))
    .returning();

  return deleted ?? existing;
}

export async function toggleTeamMemberStatus(id: string) {
  const existing = await findTeamMemberById(id);

  const [updated] = await db
    .update(teamMembers)
    .set({ isActive: !existing.isActive })
    .where(eq(teamMembers.id, id))
    .returning();

  return updated ?? existing;
}

export async function listTeamMembersByCommittee(
  committee: TeamCommittee,
  includeInactive = true,
) {
  const filters = [eq(teamMembers.committee, committee)];

  if (!includeInactive) {
    filters.push(eq(teamMembers.isActive, true));
  }

  return db
    .select()
    .from(teamMembers)
    .where(and(...filters))
    .orderBy(asc(teamMembers.order), asc(teamMembers.name));
}

export function normalizeTeamMember(row: TeamMemberRow) {
  return {
    ...row,
    socialLinks: row.socialLinks ?? {},
  };
}
