import { type NextRequest, NextResponse } from "next/server";
import {
  type DashboardUser,
  permissionProtected,
  type RouteContext,
} from "~/auth/routes-wrapper";
import {
  findTeamMemberById,
  normalizeTeamMember,
  toggleTeamMemberStatus,
} from "~/db/services/team-member-services";
import {
  getAllowedCommittees,
  type TeamCommittee,
} from "~/lib/constants/team-committees";
import { isAdmin } from "~/lib/auth/permissions";

type TeamMemberParams = {
  id: string;
};

export const PATCH = permissionProtected<TeamMemberParams>(
  ["core:manage"],
  async (_request: NextRequest, { params }: RouteContext<TeamMemberParams>, user) => {
    try {
      const { id } = await params;

      // Verify the user can manage this member's committee
      const existing = await findTeamMemberById(id);
      const permKeys = user.roles.flatMap((r) => r.permissions).map((p) => p.key);
      const allowed = getAllowedCommittees(permKeys, isAdmin(user));

      if (!allowed.includes(existing.committee as TeamCommittee)) {
        return NextResponse.json(
          { message: "You do not have permission to manage this committee" },
          { status: 403 },
        );
      }

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
