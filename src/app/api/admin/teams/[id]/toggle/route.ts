import { type NextRequest, NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
  normalizeTeamMember,
  toggleTeamMemberStatus,
} from "~/db/services/team-member-services";

type TeamMemberParams = {
  id: string;
};

export const PATCH = permissionProtected<TeamMemberParams>(
  ["team:view_all"],
  async (_request: NextRequest, { params }: RouteContext<TeamMemberParams>) => {
    try {
      const { id } = await params;
      const member = await toggleTeamMemberStatus(id);

      return NextResponse.json({
        member: normalizeTeamMember(member),
      });
    } catch (error) {
      console.error("Error toggling team member status:", error);
      return NextResponse.json(
        { message: "Failed to toggle team member status" },
        { status: 500 },
      );
    }
  },
);
