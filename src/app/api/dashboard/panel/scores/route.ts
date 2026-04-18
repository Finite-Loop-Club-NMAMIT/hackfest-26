import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  panelCriterias,
  panelRoundAssignments,
  panelScores,
} from "~/db/schema";

const saveScoresSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  scores: z.array(
    z.object({
      criteriaId: z.string().min(1, "Criteria ID is required"),
      rawScore: z.number().int().min(0),
    }),
  ),
});

export const GET = permissionProtected(
  ["panel:score"],
  async (request, _context, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const assignmentId = searchParams.get("assignmentId");

      if (!assignmentId) {
        return NextResponse.json(
          { message: "assignmentId is required" },
          { status: 400 },
        );
      }

      const panelist = await db.query.panelists.findFirst({
        where: (p, { eq }) => eq(p.dashboardUserId, user.id),
      });

      if (!panelist) {
        return NextResponse.json(
          { message: "Panelist profile not found" },
          { status: 404 },
        );
      }

      const assignment = await db.query.panelRoundAssignments.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.id, assignmentId), eq(a.panelistId, panelist.id)),
      });

      if (!assignment) {
        return NextResponse.json(
          { message: "Assignment not found" },
          { status: 404 },
        );
      }

      const round = await db.query.panelRounds.findFirst({
        where: (r, { eq }) => eq(r.id, assignment.panelRoundId),
      });

      const criteria = await db
        .select({
          id: panelCriterias.id,
          criteriaName: panelCriterias.criteriaName,
          maxScore: panelCriterias.maxScore,
        })
        .from(panelCriterias)
        .where(eq(panelCriterias.panelRoundId, assignment.panelRoundId));

      const existingScores = await db
        .select({
          criteriaId: panelScores.criteriaId,
          rawScore: panelScores.rawScore,
        })
        .from(panelScores)
        .where(eq(panelScores.roundAssignmentId, assignment.id));

      const scoreMap = new Map(
        existingScores.map((score) => [score.criteriaId, score.rawScore]),
      );

      return NextResponse.json(
        {
          assignmentId: assignment.id,
          roundStatus: round?.status ?? "Draft",
          criteria: criteria.map((item) => ({
            ...item,
            rawScore: scoreMap.get(item.id) ?? null,
          })),
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error fetching panel scores:", error);
      return NextResponse.json(
        { message: "Failed to fetch panel scores" },
        { status: 500 },
      );
    }
  },
);

export const POST = permissionProtected(
  ["panel:score"],
  async (request, _context, user) => {
    try {
      const body = await request.json();
      const parsed = saveScoresSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: parsed.error.format() },
          { status: 400 },
        );
      }

      const { assignmentId, scores } = parsed.data;

      const panelist = await db.query.panelists.findFirst({
        where: (p, { eq }) => eq(p.dashboardUserId, user.id),
      });

      if (!panelist) {
        return NextResponse.json(
          { message: "Panelist profile not found" },
          { status: 404 },
        );
      }

      const assignment = await db.query.panelRoundAssignments.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.id, assignmentId), eq(a.panelistId, panelist.id)),
      });

      if (!assignment) {
        return NextResponse.json(
          { message: "Assignment not found" },
          { status: 404 },
        );
      }

      const round = await db.query.panelRounds.findFirst({
        where: (r, { eq }) => eq(r.id, assignment.panelRoundId),
      });

      if (round?.status === "Completed") {
        return NextResponse.json(
          { message: "Round is completed. Scoring is locked." },
          { status: 409 },
        );
      }

      const criteriaIds = scores.map((score) => score.criteriaId);

      const criteriaRows =
        criteriaIds.length === 0
          ? []
          : await db
              .select({
                id: panelCriterias.id,
                maxScore: panelCriterias.maxScore,
              })
              .from(panelCriterias)
              .where(
                and(
                  eq(panelCriterias.panelRoundId, assignment.panelRoundId),
                  inArray(panelCriterias.id, criteriaIds),
                ),
              );

      const criteriaMap = new Map(
        criteriaRows.map((row) => [row.id, row.maxScore]),
      );

      for (const score of scores) {
        const maxScore = criteriaMap.get(score.criteriaId);
        if (maxScore === undefined) {
          return NextResponse.json(
            { message: "Invalid criteria for this round" },
            { status: 400 },
          );
        }

        if (score.rawScore > maxScore) {
          return NextResponse.json(
            {
              message: `Score for criteria exceeds max score (${maxScore})`,
            },
            { status: 400 },
          );
        }
      }

      // Wrap all database operations in a transaction for atomicity
      let totalRawScore = 0;
      await db.transaction(async (tx) => {
        // 1. Insert/update all scores
        for (const score of scores) {
          await tx
            .insert(panelScores)
            .values({
              roundAssignmentId: assignment.id,
              criteriaId: score.criteriaId,
              rawScore: score.rawScore,
            })
            .onConflictDoUpdate({
              target: [panelScores.roundAssignmentId, panelScores.criteriaId],
              set: { rawScore: score.rawScore },
            });
        }

        // 2. Calculate total score within transaction
        const updatedScores = await tx
          .select({ rawScore: panelScores.rawScore })
          .from(panelScores)
          .where(eq(panelScores.roundAssignmentId, assignment.id));

        totalRawScore = updatedScores.reduce(
          (sum, item) => sum + (item.rawScore ?? 0),
          0,
        );

        // 3. Update total score within transaction
        await tx
          .update(panelRoundAssignments)
          .set({ rawTotalScore: totalRawScore })
          .where(eq(panelRoundAssignments.id, assignment.id));
      });

      console.log(
        "Panel scores saved successfully, total raw score:",
        totalRawScore,
      );

      return NextResponse.json(
        { message: "Scores saved successfully", totalRawScore },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error saving panel scores:", error);
      return NextResponse.json(
        { message: "Failed to save panel scores" },
        { status: 500 },
      );
    }
  },
);
