import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
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
import { updateTeamMemberSchema } from "~/lib/validation/team-member";

type TeamMemberParams = {
  id: string;
};

const updateTeamMemberRequestSchema = updateTeamMemberSchema.extend({
  socialLinks: updateTeamMemberSchema.shape.socialLinks.optional(),
});

export const PUT = permissionProtected<TeamMemberParams>(
  ["team:view_all"],
  async (request: NextRequest, { params }: RouteContext<TeamMemberParams>) => {
    try {
      const { id } = await params;
      const existing = await findTeamMemberById(id);

      const body = await request.json();
      const parsed = updateTeamMemberRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: z.treeifyError(parsed.error) },
          { status: 400 },
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
  ["team:view_all"],
  async (_request: NextRequest, { params }: RouteContext<TeamMemberParams>) => {
    try {
      const { id } = await params;
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
