import type { NextRequest } from "next/server";
import { protectedGlobalRoute } from "~/auth/route-handlers";
import * as collegeData from "~/db/data/colleges";
import { successResponse } from "~/lib/response/success";

export const GET = protectedGlobalRoute(
  async (_request: NextRequest, _context) => {
    const colleges = await collegeData.listColleges();
    return successResponse({ colleges }, { toast: false });
  },
);
