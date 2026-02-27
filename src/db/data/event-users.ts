import { eq, inArray } from "drizzle-orm";
import {
  type UpdateEventUserInput,
  updateEventUserSchema,
} from "~/lib/validation/event";
import db from "..";
import { eventParticipants, eventUsers } from "../schema";
import { query } from ".";

export async function findById(id: string) {
  return query.eventUsers.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function updateById(id: string, data: UpdateEventUserInput) {
  const payload = updateEventUserSchema.parse(data);
  return query.eventUsers.update(id, payload);
}

export async function findByEvent(eventId: string, userId: string) {
  return query.eventParticipants.findOne({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.userId, userId)),
  });
}

export async function findLeaderByTeam(teamId: string) {
  return query.eventParticipants.findOne({
    where: (p, { and, eq }) => and(eq(p.teamId, teamId), eq(p.isLeader, true)),
  });
}

export async function findMembersByTeam(teamId: string) {
  return query.eventParticipants.findMany({
    where: (p, { eq }) => eq(p.teamId, teamId),
  });
}

export async function findParticipantsByTeam(eventId: string, teamId: string) {
  return query.eventParticipants.findMany({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.teamId, teamId)),
  });
}

export async function findUserParticipations(userId: string) {
  return await query.eventParticipants.findMany({
    where: (p, { eq }) => eq(p.userId, userId),
  });
}

export async function findParticipantsByTeamIds(teamIds: string[]) {
  if (!teamIds.length) return [];

  return db
    .select({
      participant: eventParticipants,
      user: eventUsers,
    })
    .from(eventParticipants)
    .leftJoin(eventUsers, eq(eventParticipants.userId, eventUsers.id))
    .where(inArray(eventParticipants.teamId, teamIds));
}
