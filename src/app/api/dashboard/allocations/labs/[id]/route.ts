import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import type { RouteContext } from "~/auth/routes-wrapper";
import { deleteLab } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const DELETE = adminProtected(
  async (_req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      const deleted = await deleteLab(id);
      if (!deleted) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }
      return NextResponse.json({ deleted });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
