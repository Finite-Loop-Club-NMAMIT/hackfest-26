import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  type DashboardUser,
  permissionProtected,
} from "~/auth/routes-wrapper";
import {
  createTeamMember,
  listAllTeamMembers,
  normalizeTeamMember,
} from "~/db/services/team-member-services";
import {
  getAllowedCommittees,
  type TeamCommittee,
} from "~/lib/constants/team-committees";
import { isAdmin } from "~/lib/auth/permissions";
import { createTeamMemberSchema } from "~/lib/validation/team-member";

function getUserPermissionKeys(user: NonNullable<DashboardUser>): string[] {
  return user.roles.flatMap((r) => r.permissions).map((p) => p.key);
}

export const GET = permissionProtected(
  ["core:manage"],
  async (_request: NextRequest, _ctx, user) => {
    try {
      const members = await listAllTeamMembers();

      const allowed = getAllowedCommittees(
        getUserPermissionKeys(user),
        isAdmin(user),
      );

      const filtered = members.filter((m) =>
        allowed.includes(m.committee as TeamCommittee),
      );

      return NextResponse.json({
        members: filtered.map(normalizeTeamMember),
      });
    } catch (error) {
      console.error("Error fetching team members:", error);
      return NextResponse.json(
        { message: "Failed to fetch team members" },
        { status: 500 },
      );
    }
  },
);

export const POST = permissionProtected(
  ["core:manage"],
  async (request: NextRequest, _ctx, user) => {
    const requestStart = Date.now();

    try {
      const body = await request.json();

      const allowed = getAllowedCommittees(
        getUserPermissionKeys(user),
        isAdmin(user),
      );

      if (body?.committee && !allowed.includes(body.committee as TeamCommittee)) {
        return NextResponse.json(
          { message: "You do not have permission to add members to this committee" },
          { status: 403 },
        );
      }

      console.info("[API][admin/teams][POST] Request received", {
        hasPhoto: Boolean(body?.photo),
        committee: body?.committee,
      });

      const parsed = createTeamMemberSchema.safeParse(body);

      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        console.error("[API][admin/teams][POST] Validation failed", {
          durationMs: Date.now() - requestStart,
          issues: parsed.error.issues,
        });
        return NextResponse.json(
          {
            message: firstIssue?.message || "Invalid input",
            errors: z.treeifyError(parsed.error),
          },
          { status: 400 },
        );
      }

      const insertStart = Date.now();
      const member = await createTeamMember(parsed.data);
      const insertDurationMs = Date.now() - insertStart;
      const totalDurationMs = Date.now() - requestStart;

      console.info("[API][admin/teams][POST] Member created", {
        memberId: member.id,
        insertDurationMs,
        totalDurationMs,
      });

      if (totalDurationMs > 2000) {
        console.warn("[API][admin/teams][POST] Slow create detected", {
          memberId: member.id,
          insertDurationMs,
          totalDurationMs,
        });
      }

      return NextResponse.json(
        { member: normalizeTeamMember(member) },
        { status: 201 },
      );
    } catch (error) {
      console.error("[API][admin/teams][POST] Failed", {
        durationMs: Date.now() - requestStart,
        error,
      });
      return NextResponse.json(
        { message: "Failed to create team member" },
        { status: 500 },
      );
    }
  },
);
