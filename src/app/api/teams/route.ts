import { NextResponse } from "next/server";
import {
  listPublicTeamMembersGrouped,
  normalizeTeamMember,
} from "~/db/services/team-member-services";

export async function GET() {
  try {
    const grouped = await listPublicTeamMembersGrouped();

    return NextResponse.json({
      committees: grouped.map((group) => ({
        committee: group.committee,
        members: group.members.map(normalizeTeamMember),
      })),
    });
  } catch (error) {
    console.error("Error fetching public team members:", error);
    return NextResponse.json(
      { message: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}
