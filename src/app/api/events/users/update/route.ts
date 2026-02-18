import type { NextRequest } from "next/server";
import { protectedEventRoute } from "~/auth/route-handlers";
import { updateUserDetails } from "~/db/services/event-services";
import { updateEventUserSchema } from "~/lib/validation/event";
import { parseBody } from "~/lib/validation/parse";

export const POST = protectedEventRoute(
  async (req: NextRequest, _context, user) => {
    const body = await req.json();
    const data = parseBody(updateEventUserSchema, body);

    return updateUserDetails(user.id, data);
  },
);
