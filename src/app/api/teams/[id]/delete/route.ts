import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";

export const DELETE = registrationRequiredRoute(
  async (_req: NextRequest, ctx, user) => {
    const params = await ctx.params;
    const { id: teamId } = params as { id: string };
    const team = await teamServices.deleteTeam(user.id, teamId);

    return successResponse(
      { team },
      {
        title: "Team deleted",
        description:
          "The team has been deleted and all members have been removed.",
      },
    );
  },
);
