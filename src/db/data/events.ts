import { query } from "~/db/data";

export async function getAllEvents() {
  try {
    const events = await query.events.findMany({
      where: (events, { eq, or }) =>
        or(
          eq(events.status, "Published"),
          eq(events.status, "Ongoing"),
          eq(events.status, "Completed"),
        ),
      orderBy: (events, { desc }) => desc(events.date),
      columns: {
        id: true,
        title: true,
        image: true,
        description: true,
        date: true,
        venue: true,
        deadline: true,
        type: true,
        status: true,
        minTeamSize: true,
        maxTeamSize: true,
        maxTeams: true,
      },
    });

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error("getAllEvents Error:", error);
    return {
      success: false,
      error: "Failed to fetch published events.",
    };
  }
}
