import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  type DashboardUser,
  permissionProtected,
  type RouteContext,
} from "~/auth/routes-wrapper";
import {
  deleteTeamMember,
  findTeamMemberById,
  normalizeTeamMember,
  updateTeamMember,
} from "~/db/services/team-member-services";
import {
  deleteCloudinaryAsset,
  extractCloudinaryPublicId,
} from "~/lib/cloudinary/server";
import {
  getAllowedCommittees,
  type TeamCommittee,
} from "~/lib/constants/team-committees";
import { isAdmin } from "~/lib/auth/permissions";
import { updateTeamMemberSchema } from "~/lib/validation/team-member";

type TeamMemberParams = {
  id: string;
};

const updateTeamMemberRequestSchema = updateTeamMemberSchema.extend({
  socialLinks: updateTeamMemberSchema.shape.socialLinks.optional(),
});

function getUserPermissionKeys(user: NonNullable<DashboardUser>): string[] {
  return user.roles.flatMap((r) => r.permissions).map((p) => p.key);
}
function canManageCommittee(
  user: NonNullable<DashboardUser>,
  committee: string,
): boolean {
  const allowed = getAllowedCommittees(
    getUserPermissionKeys(user),
    isAdmin(user),
  );
  return allowed.includes(committee as TeamCommittee);
}

export const PUT = permissionProtected<TeamMemberParams>(
  ["core:manage"],
  async (request: NextRequest, { params }: RouteContext<TeamMemberParams>, user) => {
    try {
      const { id } = await params;
      const existing = await findTeamMemberById(id);

      // Verify the user can manage this member's committee
      if (!canManageCommittee(user, existing.committee)) {
        return NextResponse.json(
          { message: "You do not have permission to manage this committee" },
          { status: 403 },
        );
      }

      const body = await request.json();
      const parsed = updateTeamMemberRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: z.treeifyError(parsed.error) },
          { status: 400 },
        );
      }

      if (
        parsed.data.committee &&
        parsed.data.committee !== existing.committee &&
        !canManageCommittee(user, parsed.data.committee)
      ) {
        return NextResponse.json(
          { message: "You do not have permission to move members to that committee" },
          { status: 403 },
        );
      }

      const nextPhoto = parsed.data.photo;
      const hasPhotoReplacement = !!nextPhoto && nextPhoto !== existing.photo;

      if (hasPhotoReplacement) {
        const oldCloudinaryId =
          existing.cloudinaryId || extractCloudinaryPublicId(existing.photo);

        if (oldCloudinaryId) {
          await deleteCloudinaryAsset(oldCloudinaryId);
        }

        if (!parsed.data.cloudinaryId) {
          parsed.data.cloudinaryId =
            extractCloudinaryPublicId(nextPhoto) ?? undefined;
        }
      }

      const member = await updateTeamMember(id, parsed.data);

      return NextResponse.json({
        member: normalizeTeamMember(member),
      });
    } catch (error) {
      console.error("Error updating team member:", error);
      return NextResponse.json(
        { message: "Failed to update team member" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = permissionProtected<TeamMemberParams>(
  ["core:manage"],
  async (_request: NextRequest, { params }: RouteContext<TeamMemberParams>, user) => {
    try {
      const { id } = await params;

      // Fetch member first to check committee
      const existing = await findTeamMemberById(id);

      if (!canManageCommittee(user, existing.committee)) {
        return NextResponse.json(
          { message: "You do not have permission to manage this committee" },
          { status: 403 },
        );
      }

      const member = await deleteTeamMember(id);

      const cloudinaryId =
        member.cloudinaryId || extractCloudinaryPublicId(member.photo);
      if (cloudinaryId) {
        await deleteCloudinaryAsset(cloudinaryId);
      }

      return NextResponse.json({
        message: "Member deleted successfully",
        member: normalizeTeamMember(member),
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      return NextResponse.json(
        { message: "Failed to delete team member" },
        { status: 500 },
      );
    }
  },
);
