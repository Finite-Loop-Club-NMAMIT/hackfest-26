import { protectedRoute } from "~/auth/route-handlers";
import { createSupportTicket } from "~/db/services/support-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = protectedRoute(async (req: Request, _context, user) => {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return errorResponse(
        new AppError("INVALID_INPUT", 400, {
          title: "Invalid input",
          description: "Description is required and must not be empty.",
        }),
      );
    }

    return await createSupportTicket(user.id, description);
  } catch (error) {
    console.error("Compass Support API error:", error);
    return errorResponse(error);
  }
});
