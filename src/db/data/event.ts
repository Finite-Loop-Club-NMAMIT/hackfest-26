import { query } from ".";

export async function findByEventId(id: string) {
  return query.events.findOne({
    where: (e, { eq }) => eq(e.id, id),
  });
}
