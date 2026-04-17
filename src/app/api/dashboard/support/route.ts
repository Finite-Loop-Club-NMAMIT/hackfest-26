import { permissionProtected } from "~/auth/routes-wrapper";
import {
  fetchSupportTickets,
  resolveSupportTicket,
} from "~/db/services/support-services";
import { errorResponse } from "~/lib/response/error";

export const GET = permissionProtected(["support:manage"], async () => {
  try {
    return await fetchSupportTickets();
  } catch (error) {
    console.error("Dashboard Support GET error:", error);
    return errorResponse(error);
  }
});

export const PATCH = permissionProtected(
  ["support:manage"],
  async (request: Request) => {
    try {
      const { id, isResolved } = await request.json();

      return await resolveSupportTicket(id, isResolved);
    } catch (error) {
      console.error("Dashboard Support PATCH error:", error);
      return errorResponse(error);
    }
  },
);
