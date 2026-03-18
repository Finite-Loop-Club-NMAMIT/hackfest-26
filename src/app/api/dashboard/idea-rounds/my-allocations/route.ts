import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { fetchMyAllocations } from "~/db/services/idea-services";

export const GET = permissionProtected(
  ["submission:score"],
  async (_request, _context, user) => {
    try {
      const response = await fetchMyAllocations(user);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error fetching idea round allocations:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch idea round allocations";
      const status = (error as any).statusCode || 500;
      return NextResponse.json({ message }, { status });
    }
  },
);
