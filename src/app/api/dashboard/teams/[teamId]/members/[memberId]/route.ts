import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminProtected, type RouteContext } from "~/auth/routes-wrapper";
import db from "~/db";
import { participants, teams } from "~/db/schema";
import { getCurrentActor } from "~/lib/mixpanel/getActor";
import { trackAudit } from "~/lib/mixpanel/tracker";

type MemberParams = { teamId: string; memberId: string };

export const PATCH = adminProtected<MemberParams>(
  async (request: Request, { params }: RouteContext<MemberParams>) => {
    const { teamId, memberId } = await params;
    const body = await request.json();

    let updatedTeam: { leaderId: string } | undefined;

    if (body.isLeader) {
      [updatedTeam] = await db
        .update(teams)
        .set({ leaderId: memberId })
        .where(eq(teams.id, teamId))
        .returning();
    }

    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, memberId));

    if (!participant) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...participant,
      isLeader: updatedTeam?.leaderId === participant.id || !!body.isLeader,
    });
  },
);

export const DELETE = adminProtected<MemberParams>(
  async (_request: Request, { params }: RouteContext<MemberParams>) => {
    const actor = await getCurrentActor();

    const { memberId } = await params;

    const participant = await db.query.participants.findFirst({
      where: eq(participants.id, memberId),
    });

    if (!participant) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const teamDetails = await db.query.teams.findFirst({
      where: eq(teams.id, participant.teamId ?? ""),
    });

    if (!teamDetails) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const entity = {
      id: teamDetails.id,
      name: teamDetails.name,
      type: "Team",
    };

    const [updated] = await db
      .update(participants)
      .set({
        teamId: null,
      })
      .where(eq(participants.id, memberId))
      .returning();

    trackAudit({
      actor,
      action: "- Remove Member",
      entity,
      previousValue: {
        id: participant.id,
        teamId: participant.teamId,
        teamName: teamDetails.name,
        memberName: participant.name,
      },
      newValue: {
        id: participant.id,
        teamId: updated.teamId,
        teamName: "",
        memberName: updated.name,
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  },
);
