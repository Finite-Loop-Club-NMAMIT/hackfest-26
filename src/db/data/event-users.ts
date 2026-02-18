import {
  type UpdateEventUserInput,
  updateEventUserSchema,
} from "~/lib/validation/event";
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

export async function addParticipant(
  eventId: string,
  teamId: string,
  userId: string,
  isLeader: boolean,
) {
  return query.eventParticipants.insert({
    eventId: eventId,
    teamId: teamId,
    userId: userId,
    isLeader: isLeader,
  });
}

export async function deleteParticipant(id: string) {
  return query.eventParticipants.delete(id);
}
