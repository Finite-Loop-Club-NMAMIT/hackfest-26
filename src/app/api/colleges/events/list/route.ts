import type { NextRequest } from "next/server";
import { protectedEventRoute } from "~/auth/route-handlers";
import * as collegeData from "~/db/data/colleges";
import { successResponse } from "~/lib/response/success";

export const GET = protectedEventRoute(
  async (_request: NextRequest, _context) => {
    const colleges = await collegeData.listColleges();
    return successResponse({ colleges }, { toast: false });
  },
);
