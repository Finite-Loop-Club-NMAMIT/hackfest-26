import { NextResponse } from "next/server";
import {
  listPublicFacultyMembers,
  normalizeFacultyMember,
} from "~/db/services/faculty-services";

export async function GET() {
  try {
    const faculty = await listPublicFacultyMembers();

    return NextResponse.json({
      faculty: faculty.map(normalizeFacultyMember),
    });
  } catch (error) {
    console.error("Error fetching public faculty members:", error);
    return NextResponse.json(
      { message: "Failed to fetch faculty" },
      { status: 500 },
    );
  }
}
