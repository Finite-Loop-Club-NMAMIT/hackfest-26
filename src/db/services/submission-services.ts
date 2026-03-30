import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { DashboardUser } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  ideaSubmission,
  notSelected,
  roles,
  selected,
  semiSelected,
  type teamStage,
  teams,
} from "~/db/schema";
import { isAdmin } from "~/lib/auth/permissions";
import { AppError } from "~/lib/errors/app-error";

export type SubmissionRound = "ROUND_1" | "ROUND_2";
export type TeamStage = (typeof teamStage.enumValues)[number];

const EVALUATOR_ACCESS_PERMISSION_KEY = "submission:score";

export async function promoteLeaderboardTeams(
  teamIds: string[],
  currentStage: TeamStage,
  nextStage: TeamStage,
  user: DashboardUser,
) {
  const isAdminUser = isAdmin(user);
  if (!isAdminUser) {
    throw new AppError("Unauthorized", 403, {
      title: "Unauthorized",
      description: "You do not have permission to perform this action.",
    });
  }
  const uniqueTeamIds = Array.from(new Set(teamIds.filter(Boolean)));

  if (uniqueTeamIds.length === 0) {
    return { movedCount: 0 };
  }

  const eligibleRows = await db
    .select({ id: teams.id })
    .from(teams)
    .innerJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
    .where(
      and(inArray(teams.id, uniqueTeamIds), eq(teams.teamStage, currentStage)),
    );

  const eligibleTeamIds = eligibleRows.map((row) => row.id);

  if (eligibleTeamIds.length === 0) {
    return { movedCount: 0 };
  }

  let movedRows: { id: string }[] = [];
  await db.transaction(async (tx) => {
    if (nextStage === "SEMI_SELECTED") {
      await tx
        .delete(notSelected)
        .where(inArray(notSelected.teamId, eligibleTeamIds));
      await tx.insert(semiSelected).values(
        eligibleTeamIds.map((id) => ({
          teamId: id,
        })),
      );
    } else if (nextStage === "SELECTED") {
      await tx
        .delete(semiSelected)
        .where(inArray(semiSelected.teamId, eligibleTeamIds));
      await tx.insert(selected).values(
        eligibleTeamIds.map((id) => ({
          teamId: id,
        })),
      );
    }
    movedRows = await tx
      .update(teams)
      .set({ teamStage: nextStage })
      .where(inArray(teams.id, eligibleTeamIds))
      .returning({ id: teams.id });
  });

  return { movedCount: movedRows.length };
}

// export async function bulkPromoteSubmissions(
//   teamIds: string[],
//   nextStage: TeamStage,
//   user: DashboardUser,
// ) {
//   const isAdminUser = isAdmin(user);
//   if (!isAdminUser) {
//     throw new AppError("Unauthorized", 403, {
//       title: "Unauthorized",
//       description: "You do not have permission to perform this action.",
//     });
//   }
//   const uniqueTeamIds = Array.from(new Set(teamIds.filter(Boolean)));

//   if (uniqueTeamIds.length === 0) {
//     return { movedCount: 0 };
//   }

//   const eligibleRows = await db
//     .select({ id: teams.id, teamStage: teams.teamStage })
//     .from(teams)
//     .innerJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
//     .where(inArray(teams.id, uniqueTeamIds));

//   // Filter out teams that are already at the target stage
//   const eligibleTeamIds = eligibleRows
//     .filter((r) => r.teamStage !== nextStage)
//     .map((row) => row.id);

//   if (eligibleTeamIds.length === 0) {
//     return { movedCount: 0 };
//   }

//   let movedRows: { id: string }[] = [];
//   await db.transaction(async (tx) => {
//     // Delete from all stage tables (cleanup old stage data)
//     await tx
//       .delete(notSelected)
//       .where(inArray(notSelected.teamId, eligibleTeamIds));
//     await tx
//       .delete(semiSelected)
//       .where(inArray(semiSelected.teamId, eligibleTeamIds));
//     if (nextStage !== "SELECTED") {
//       await tx
//         .delete(selected)
//         .where(inArray(selected.teamId, eligibleTeamIds));
//     }

//     if (nextStage === "NOT_SELECTED") {
//       await tx.insert(notSelected).values(
//         eligibleTeamIds.map((id) => ({
//           teamId: id,
//         })),
//       );
//     } else if (nextStage === "SEMI_SELECTED") {
//       await tx.insert(semiSelected).values(
//         eligibleTeamIds.map((id) => ({
//           teamId: id,
//         })),
//       );
//     } else if (nextStage === "SELECTED") {
//       await tx.insert(selected).values(
//         eligibleTeamIds.map((id) => ({
//           teamId: id,
//         })),
//       );
//     }

//     movedRows = await tx
//       .update(teams)
//       .set({ teamStage: nextStage })
//       .where(inArray(teams.id, eligibleTeamIds))
//       .returning({ id: teams.id });
//   });

//   return { movedCount: movedRows.length };
// }

export async function listEvaluatorAccessRoles() {
  const evaluatorPermission = await db.query.permissions.findFirst({
    where: (table, { eq }) => eq(table.key, EVALUATOR_ACCESS_PERMISSION_KEY),
    columns: { id: true, key: true },
  });

  if (!evaluatorPermission) {
    throw new AppError("submission:score permission does not exist", 400, {
      title: "Evaluator permission missing",
      description:
        "Create the submission:score permission before configuring evaluator access.",
    });
  }

  const roleRows = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isActive: roles.isActive,
      hasEvaluatorAccess:
        sql<boolean>`EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = ${roles.id} AND rp.permission_id = ${evaluatorPermission.id})`.mapWith(
          Boolean,
        ),
    })
    .from(roles)
    .orderBy(asc(roles.name));

  return {
    evaluatorPermissionKey: evaluatorPermission.key,
    roles: roleRows,
  };
}
