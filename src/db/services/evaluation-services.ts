import { sql } from "drizzle-orm";
import db from "~/db";

export async function recomputeNormalizedScores(
  evaluatorId: string,
  roundId: string,
) {
  await db.execute(sql`
    UPDATE idea_team_evaluations AS ite
    SET normalized_total_score = CASE
      WHEN stats.stddev = 0 THEN 0
      ELSE (ite.raw_total_score - stats.mean) / stats.stddev
    END
    FROM (
      SELECT
        evaluator_id,
        round_id,
        AVG(raw_total_score::double precision) AS mean,
        COALESCE(STDDEV_POP(raw_total_score::double precision), 0) AS stddev
      FROM idea_team_evaluations
      WHERE evaluator_id = ${evaluatorId}
        AND round_id = ${roundId}
        AND raw_total_score IS NOT NULL
      GROUP BY evaluator_id, round_id
    ) AS stats
    WHERE ite.evaluator_id = stats.evaluator_id
      AND ite.round_id = stats.round_id
      AND ite.evaluator_id = ${evaluatorId}
  `);
}

export async function aggregateIdeaTeamScores(roundId: string) {
  await db.execute(sql`
    INSERT INTO idea_team_round_scores (id, team_id, round_id, raw_total_score, normalized_total_score, evaluator_count)
    SELECT
      gen_random_uuid(),
      ite.team_id,
      ite.round_id,
      AVG(ite.raw_total_score)::integer,
      AVG(ite.normalized_total_score),
      COUNT(DISTINCT ite.evaluator_id)
    FROM idea_team_evaluations ite
    WHERE ite.round_id = ${roundId}
      AND ite.normalized_total_score IS NOT NULL
    GROUP BY ite.team_id, ite.round_id
    ON CONFLICT (team_id, round_id)
    DO UPDATE SET
      raw_total_score = EXCLUDED.raw_total_score,
      normalized_total_score = EXCLUDED.normalized_total_score,
      evaluator_count = EXCLUDED.evaluator_count
  `);
}
