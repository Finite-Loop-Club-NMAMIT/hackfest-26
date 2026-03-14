import { NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import { listSubmissionsForRound } from "~/db/services/submission-services";
import { errorResponse } from "~/lib/response/error";

const querySchema = z.object({
  round: z.enum(["ROUND_1", "ROUND_2"]).default("ROUND_1"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  trackId: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = permissionProtected(
  ["submission:view", "submission:score"],
  async (request, _context, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const parsed = querySchema.parse({
        round: searchParams.get("round") ?? undefined,
        cursor: searchParams.get("cursor") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
        trackId: searchParams.get("trackId") ?? undefined,
        sortOrder: searchParams.get("sortOrder") ?? undefined,
      });

      const result = await listSubmissionsForRound({
        ...parsed,
        evaluatorId: user.id,
      });

      return NextResponse.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  },
);
