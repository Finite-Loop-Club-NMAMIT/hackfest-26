import { type NextRequest, NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
  normalizeFacultyMember,
  toggleFacultyMemberStatus,
} from "~/db/services/faculty-services";

type FacultyMemberParams = {
  id: string;
};

export const PATCH = permissionProtected<FacultyMemberParams>(
  ["team:view_all"],
  async (
    _request: NextRequest,
    { params }: RouteContext<FacultyMemberParams>,
  ) => {
    try {
      const { id } = await params;
      const faculty = await toggleFacultyMemberStatus(id);

      return NextResponse.json({
        faculty: normalizeFacultyMember(faculty),
      });
    } catch (error) {
      console.error("Error toggling faculty member status:", error);
      return NextResponse.json(
        { message: "Failed to toggle faculty member status" },
        { status: 500 },
      );
    }
  },
);
