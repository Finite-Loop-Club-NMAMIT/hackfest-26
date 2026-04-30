import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
  deleteFacultyMember,
  findFacultyMemberById,
  normalizeFacultyMember,
  updateFacultyMember,
} from "~/db/services/faculty-services";
import {
  deleteCloudinaryAsset,
  extractCloudinaryPublicId,
} from "~/lib/cloudinary/server";
import { updateFacultySchema } from "~/lib/validation/faculty";

type FacultyMemberParams = {
  id: string;
};

const updateFacultyRequestSchema = updateFacultySchema.extend({
  socialLinks: updateFacultySchema.shape.socialLinks.optional(),
});

export const PUT = permissionProtected<FacultyMemberParams>(
  ["team:view_all"],
  async (
    request: NextRequest,
    { params }: RouteContext<FacultyMemberParams>,
  ) => {
    try {
      const { id } = await params;
      const existing = await findFacultyMemberById(id);

      const body = await request.json();
      const parsed = updateFacultyRequestSchema.safeParse(body);

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

      const faculty = await updateFacultyMember(id, parsed.data);

      return NextResponse.json({
        faculty: normalizeFacultyMember(faculty),
      });
    } catch (error) {
      console.error("Error updating faculty member:", error);
      return NextResponse.json(
        { message: "Failed to update faculty member" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = permissionProtected<FacultyMemberParams>(
  ["team:view_all"],
  async (
    _request: NextRequest,
    { params }: RouteContext<FacultyMemberParams>,
  ) => {
    try {
      const { id } = await params;
      const faculty = await deleteFacultyMember(id);

      const cloudinaryId =
        faculty.cloudinaryId || extractCloudinaryPublicId(faculty.photo);
      if (cloudinaryId) {
        await deleteCloudinaryAsset(cloudinaryId);
      }

      return NextResponse.json({
        message: "Faculty member deleted successfully",
        faculty: normalizeFacultyMember(faculty),
      });
    } catch (error) {
      console.error("Error deleting faculty member:", error);
      return NextResponse.json(
        { message: "Failed to delete faculty member" },
        { status: 500 },
      );
    }
  },
);
