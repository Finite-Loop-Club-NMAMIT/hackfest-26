import { query } from "~/db/data";

export type GetAllEventsResponse = {
  success: boolean;
  data?: {
    date: Date;
    id: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
    type: "Solo" | "Team";
    title: string;
    description: string;
    venue: string;
    deadline: Date;
    status: "Draft" | "Published" | "Ongoing" | "Completed";
    maxTeams: number;
    minTeamSize: number;
    maxTeamSize: number;
  }[];
  error?: string;
};

export async function getAllEvents(): Promise<GetAllEventsResponse> {
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
    } as GetAllEventsResponse;
  } catch (error) {
    console.error("getAllEvents Error:", error);
    return {
      success: false,
      error: "Failed to fetch published events.",
    } as GetAllEventsResponse;
  }
}

export async function getAllEventsForAdmin(): Promise<GetAllEventsResponse> {
  try {
    const events = await query.events.findMany({
      orderBy: (events, { desc }) => desc(events.date),
    });

    return {
      success: true,
      data: events,
    } as GetAllEventsResponse;
  } catch (error) {
    console.error("getAllEventsForAdmin Error:", error);
    return {
      success: false,
      error: "Failed to fetch events for admin.",
    } as GetAllEventsResponse;
  }
}
