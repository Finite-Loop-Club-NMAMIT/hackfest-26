import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/auth/event-config";
import { publicRoute } from "~/auth/route-handlers";
import { getAllEvents } from "~/db/data/events";

export const GET = publicRoute(async (_req: NextRequest) => {
  const session = await auth();

  if (session?.eventUser) {
    const events = await getAllEvents(session.eventUser.id);
    return NextResponse.json(events);
  }

  const events = await getAllEvents();
  return NextResponse.json(events);
});
