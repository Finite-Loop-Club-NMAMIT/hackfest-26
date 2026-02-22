import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import { submitIdea } from "~/db/services/idea-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

export const POST = registrationRequiredRoute(
  async (req: NextRequest, _ctx, user) => {
    const { teamId, pdfUrl, trackId } = await req.json();
    try {
      const result = await submitIdea({
        teamId,
        pdfUrl,
        trackId,
        userId: user.id,
      });
      return successResponse({ result });
    } catch (e) {
      if (e instanceof AppError) {
        return errorResponse(e);
      }
      return errorResponse(
        new AppError("INTERNAL_ERROR", 500, {
          title: "Internal server error",
          description: "Failed to submit idea. Please try again later.",
        }),
      );
    }
  },
);
