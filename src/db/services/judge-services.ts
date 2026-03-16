import { sql } from "drizzle-orm";
import db from "../index";

export async function recalculateNormalizedScores(
  judgeId: string,
  judgeRoundId: string,
) {
  // TODO[RAHUL]: Test and also scale score to make it range from 0 to 50 or 100
  await db.execute(sql`
    UPDATE judge_round_assignments AS jra
    SET normalized_total_score = CASE
      WHEN stats.stddev = 0 THEN 0
      ELSE (jra.raw_total_score - stats.mean) / stats.stddev
    END
    FROM (
      SELECT
        judge_id,
        judge_round_id,
        AVG(raw_total_score::double precision) AS mean,
        COALESCE(STDDEV_POP(raw_total_score::double precision), 0) AS stddev
      FROM judge_round_assignments
      WHERE judge_id = ${judgeId}
        AND judge_round_id = ${judgeRoundId}
        AND raw_total_score IS NOT NULL
      GROUP BY judge_id, judge_round_id
    ) AS stats
    WHERE jra.judge_id = stats.judge_id
      AND jra.judge_round_id = stats.judge_round_id
      AND jra.raw_total_score IS NOT NULL
  `);
}

export async function aggregateTeamScores(judgeRoundId: string) {
  await db.execute(sql`
    INSERT INTO team_round_scores (id, team_id, round_id, normalized_total_score, judge_count)
    SELECT
      gen_random_uuid(),
      jra.team_id,
      jra.judge_round_id,
      AVG(jra.raw_total_score)::integer,
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
}
