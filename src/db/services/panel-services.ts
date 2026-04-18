import { sql } from "drizzle-orm";
import db from "../index";

export async function recalculatePanelNormalizedScores(
  panelistId: string,
  panelRoundId: string,
) {
  console.log(
    `[recalculatePanelNormalizedScores] Starting for panelist=${panelistId}, round=${panelRoundId}`,
  );

  const updateResult = await db.execute(sql`
    WITH stats AS (
      SELECT
        panelist_id,
        panel_round_id,
        AVG(raw_total_score::double precision) AS mean,
        COALESCE(STDDEV_POP(raw_total_score::double precision), 0) AS stddev,
        COUNT(*) AS score_count
      FROM panel_round_assignments
      WHERE panelist_id = ${panelistId}
        AND panel_round_id = ${panelRoundId}
        AND raw_total_score IS NOT NULL
      GROUP BY panelist_id, panel_round_id
    )
    UPDATE panel_round_assignments AS pra
    SET normalized_total_score = CASE
      WHEN stats.score_count = 1 OR stats.stddev = 0 THEN 0
      ELSE (pra.raw_total_score - stats.mean) / stats.stddev
    END
    FROM stats
    WHERE pra.panelist_id = stats.panelist_id
      AND pra.panel_round_id = stats.panel_round_id
      AND pra.raw_total_score IS NOT NULL
  `);

  console.log(
    `[recalculatePanelNormalizedScores] Updated ${updateResult.rowCount ?? 0} assignments with normalized scores`,
  );

  // Clear normalized scores for assignments without raw scores
  const clearResult = await db.execute(sql`
    UPDATE panel_round_assignments
    SET normalized_total_score = NULL
    WHERE panelist_id = ${panelistId}
      AND panel_round_id = ${panelRoundId}
      AND raw_total_score IS NULL
  `);

  console.log(
    `[recalculatePanelNormalizedScores] Cleared ${clearResult.rowCount ?? 0} assignments without raw scores`,
  );
}

export async function aggregatePanelTeamScores(panelRoundId: string) {
  // First, check if there are any normalized scores to aggregate
  const checkResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM panel_round_assignments
    WHERE panel_round_id = ${panelRoundId}
      AND normalized_total_score IS NOT NULL
  `);

  const count = Number(checkResult.rows[0]?.count ?? 0);

  if (count === 0) {
    console.log(
      `[aggregatePanelTeamScores] No normalized scores found for round ${panelRoundId}, skipping aggregation`,
    );
    return;
  }

  console.log(
    `[aggregatePanelTeamScores] Found ${count} normalized assignments for round ${panelRoundId}, aggregating...`,
  );

  // Perform the aggregation and insert/update panel_team_round_scores
  const result = await db.execute(sql`
    INSERT INTO panel_team_round_scores (id, team_id, round_id, raw_total_score, normalized_total_score, panelist_count)
    SELECT
      gen_random_uuid(),
      pra.team_id,
      pra.panel_round_id,
      COALESCE(SUM(pra.raw_total_score), 0)::integer,
      AVG(pra.normalized_total_score),
      COUNT(DISTINCT pra.panelist_id)
    FROM panel_round_assignments pra
    WHERE pra.panel_round_id = ${panelRoundId}
      AND pra.normalized_total_score IS NOT NULL
    GROUP BY pra.team_id, pra.panel_round_id
    ON CONFLICT (team_id, round_id)
    DO UPDATE SET
      raw_total_score = EXCLUDED.raw_total_score,
      normalized_total_score = EXCLUDED.normalized_total_score,
      panelist_count = EXCLUDED.panelist_count
  `);

  console.log(
    `[aggregatePanelTeamScores] Successfully aggregated scores for round ${panelRoundId}`,
  );

  return result;
}
