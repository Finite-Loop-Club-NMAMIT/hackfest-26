import { and, eq } from "drizzle-orm";
import db from "~/db";
import { ideaRounds, ideaTeamEvaluations } from "~/db/schema/evaluator";
import { AppError } from "~/lib/errors/app-error";
import {
  ensureRoundForEvaluation,
  type SubmissionRound,
} from "./submission-services";

export async function submitEvaluationScore({
  evaluatorId,
  teamId,
  score,
  round,
  isEvaluator,
}: {
  evaluatorId: string;
  teamId: string;
  score: number;
  round: SubmissionRound;
  isEvaluator: boolean;
}) {
  if (!isEvaluator) {
    throw new AppError("Only EVALUATOR users can submit scores", 403, {
      title: "Access denied",
      description: "This action requires the EVALUATOR role.",
    });
  }

  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new AppError("Score must be an integer between 0 and 10", 400, {
      title: "Invalid score",
      description: "Allowed score range is 0 to 10.",
    });
  }

  const submission = await db.query.ideaSubmission.findFirst({
    where: (table, { eq }) => eq(table.teamId, teamId),
    columns: { teamId: true },
  });

  if (!submission) {
    throw new AppError("Submission not found for the team", 404, {
      title: "Submission missing",
      description: "Team must have an idea submission before evaluation.",
    });
  }

  const roundRecord = await ensureRoundForEvaluation(round);

  const [existing] = await db
    .select({ id: ideaTeamEvaluations.id })
    .from(ideaTeamEvaluations)
    .where(
      and(
        eq(ideaTeamEvaluations.roundId, roundRecord.id),
        eq(ideaTeamEvaluations.teamId, teamId),
        eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(ideaTeamEvaluations)
      .set({
        rawTotalScore: score,
        normalizedTotalScore: score,
      })
      .where(eq(ideaTeamEvaluations.id, existing.id))
      .returning();

    return {
      mode: "updated" as const,
      evaluation: updated,
    };
  }

  const [created] = await db
    .insert(ideaTeamEvaluations)
    .values({
      id: crypto.randomUUID(),
      roundId: roundRecord.id,
      teamId,
      evaluatorId,
      rawTotalScore: score,
      normalizedTotalScore: score,
    })
    .returning();

  return {
    mode: "created" as const,
    evaluation: created,
  };
}

export async function getEvaluatorScore({
  evaluatorId,
  teamId,
  round,
}: {
  evaluatorId: string;
  teamId: string;
  round: SubmissionRound;
}) {
  const roundName = round === "ROUND_2" ? "Round 2" : "Round 1";
  const [roundRecord] = await db
    .select({ id: ideaRounds.id })
    .from(ideaRounds)
    .where(eq(ideaRounds.name, roundName))
    .limit(1);

  if (!roundRecord) {
    return null;
  }

  const evaluation = await db
    .select({ score: ideaTeamEvaluations.rawTotalScore })
    .from(ideaTeamEvaluations)
    .where(
      and(
        eq(ideaTeamEvaluations.roundId, roundRecord.id),
        eq(ideaTeamEvaluations.teamId, teamId),
        eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
      ),
    )
    .limit(1);

  return evaluation[0]?.score ?? null;
}
