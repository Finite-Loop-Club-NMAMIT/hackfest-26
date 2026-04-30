import { and, asc, eq } from "drizzle-orm";
import db from "~/db";
import { facultyMembers } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import {
  type CreateFacultyInput,
  createFacultySchema,
  type UpdateFacultyInput,
  updateFacultySchema,
} from "~/lib/validation/faculty";

type FacultyMemberRow = typeof facultyMembers.$inferSelect;

export async function listAllFacultyMembers() {
  return db
    .select()
    .from(facultyMembers)
    .orderBy(asc(facultyMembers.order), asc(facultyMembers.name));
}

export async function listPublicFacultyMembers() {
  return db
    .select()
    .from(facultyMembers)
    .where(eq(facultyMembers.isActive, true))
    .orderBy(asc(facultyMembers.order), asc(facultyMembers.name));
}

export async function findFacultyMemberById(id: string) {
  const member = await db.query.facultyMembers.findFirst({
    where: eq(facultyMembers.id, id),
  });

  if (!member) {
    throw new AppError("FACULTY_MEMBER_NOT_FOUND", 404, {
      title: "Faculty member not found",
      description: "The selected faculty member does not exist.",
    });
  }

  return member;
}

export async function createFacultyMember(input: CreateFacultyInput) {
  const payload = createFacultySchema.parse(input);

  const [created] = await db
    .insert(facultyMembers)
    .values({
      ...payload,
      socialLinks: payload.socialLinks ?? {},
    })
    .returning();

  return created;
}

export async function updateFacultyMember(
  id: string,
  input: UpdateFacultyInput,
) {
  const payload = updateFacultySchema.parse(input);
  const existing = await findFacultyMemberById(id);

  const [updated] = await db
    .update(facultyMembers)
    .set(payload)
    .where(eq(facultyMembers.id, id))
    .returning();

  if (!updated) {
    return existing;
  }

  return updated;
}

export async function deleteFacultyMember(id: string) {
  const existing = await findFacultyMemberById(id);

  const [deleted] = await db
    .delete(facultyMembers)
    .where(eq(facultyMembers.id, id))
    .returning();

  return deleted ?? existing;
}

export async function toggleFacultyMemberStatus(id: string) {
  const existing = await findFacultyMemberById(id);

  const [updated] = await db
    .update(facultyMembers)
    .set({ isActive: !existing.isActive })
    .where(eq(facultyMembers.id, id))
    .returning();

  return updated ?? existing;
}

export async function listFacultyMembersByDepartment(
  department: string,
  includeInactive = true,
) {
  const filters = [eq(facultyMembers.department, department)];

  if (!includeInactive) {
    filters.push(eq(facultyMembers.isActive, true));
  }

  return db
    .select()
    .from(facultyMembers)
    .where(and(...filters))
    .orderBy(asc(facultyMembers.order), asc(facultyMembers.name));
}

export function normalizeFacultyMember(row: FacultyMemberRow) {
  return {
    ...row,
    socialLinks: row.socialLinks ?? {},
  };
}
