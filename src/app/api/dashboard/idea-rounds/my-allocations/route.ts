import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { fetchMyAllocations } from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = permissionProtected(
  ["submission:score"],
  async (_request, _context, user) => {
    try {
      const response = await fetchMyAllocations(user);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
