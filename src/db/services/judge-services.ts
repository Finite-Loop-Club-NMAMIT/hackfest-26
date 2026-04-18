import { sql } from "drizzle-orm";
import db from "../index";

export async function recalculateNormalizedScores(
  judgeId: string,
  judgeRoundId: string,
) {
  console.log(
    `[recalculateNormalizedScores] Starting for judge=${judgeId}, round=${judgeRoundId}`,
  );

  // Z-score normalization: (score - mean) / stddev
  // Only process assignments with non-NULL raw scores
  const updateResult = await db.execute(sql`
    WITH stats AS (
      SELECT
        judge_id,
        judge_round_id,
        AVG(raw_total_score::double precision) AS mean,
        COALESCE(STDDEV_POP(raw_total_score::double precision), 0) AS stddev,
        COUNT(*) AS score_count
      FROM judge_round_assignments
      WHERE judge_id = ${judgeId}
        AND judge_round_id = ${judgeRoundId}
        AND raw_total_score IS NOT NULL
      GROUP BY judge_id, judge_round_id
    )
    UPDATE judge_round_assignments AS jra
    SET normalized_total_score = CASE
      -- If only one score or stddev is 0, set normalized score to 0
      WHEN stats.score_count = 1 OR stats.stddev = 0 THEN 0
      -- Calculate z-score
      ELSE (jra.raw_total_score - stats.mean) / stats.stddev
    END
    FROM stats
    WHERE jra.judge_id = stats.judge_id
      AND jra.judge_round_id = stats.judge_round_id
      AND jra.raw_total_score IS NOT NULL
  `);

  console.log(
    `[recalculateNormalizedScores] Updated ${updateResult.rowCount ?? 0} assignments with normalized scores`,
  );

  // Clear normalized scores for assignments without raw scores
  const clearResult = await db.execute(sql`
    UPDATE judge_round_assignments
    SET normalized_total_score = NULL
    WHERE judge_id = ${judgeId}
      AND judge_round_id = ${judgeRoundId}
      AND raw_total_score IS NULL
  `);

  console.log(
    `[recalculateNormalizedScores] Cleared ${clearResult.rowCount ?? 0} assignments without raw scores`,
  );
}

export async function aggregateTeamScores(judgeRoundId: string) {
  // First, check if there are any normalized scores to aggregate
  const checkResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM judge_round_assignments
    WHERE judge_round_id = ${judgeRoundId}
      AND normalized_total_score IS NOT NULL
  `);

  const count = Number(checkResult.rows[0]?.count ?? 0);

  if (count === 0) {
    console.log(
      `[aggregateTeamScores] No normalized scores found for round ${judgeRoundId}, skipping aggregation`,
    );
    return;
  }

  console.log(
    `[aggregateTeamScores] Found ${count} normalized assignments for round ${judgeRoundId}, aggregating...`,
  );

  // Perform the aggregation and insert/update team_round_scores
  const result = await db.execute(sql`
    INSERT INTO team_round_scores (id, team_id, round_id, raw_total_score, normalized_total_score, judge_count)
    SELECT
      gen_random_uuid(),
      jra.team_id,
      jra.judge_round_id,
      COALESCE(SUM(jra.raw_total_score), 0)::integer,
      AVG(jra.normalized_total_score),
      COUNT(DISTINCT jra.judge_id)
    FROM judge_round_assignments jra
    WHERE jra.judge_round_id = ${judgeRoundId}
      AND jra.normalized_total_score IS NOT NULL
    GROUP BY jra.team_id, jra.judge_round_id
    ON CONFLICT (team_id, round_id)
    DO UPDATE SET
      raw_total_score = EXCLUDED.raw_total_score,
      normalized_total_score = EXCLUDED.normalized_total_score,
      judge_count = EXCLUDED.judge_count
  `);

  console.log(
    `[aggregateTeamScores] Successfully aggregated scores for round ${judgeRoundId}`,
  );

  return result;
}
