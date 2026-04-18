import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUsers,
  judgeRoundAssignments,
  judges,
  lab,
  labTeams,
  teams,
} from "~/db/schema";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");

    let roundLabel = "All Rounds";
    if (judgeRoundId) {
      const round = await db.query.judgeRounds.findFirst({
        where: (r, { eq }) => eq(r.id, judgeRoundId),
      });
      if (round) roundLabel = round.name;
    }

    const allJudges = await db
      .select({
        judgeId: judges.id,
        judgeName: dashboardUsers.name,
        judgeUsername: dashboardUsers.username,
      })
      .from(judges)
      .innerJoin(dashboardUsers, eq(dashboardUsers.id, judges.dashboardUserId))
      .orderBy(asc(dashboardUsers.name));

    const baseQuery = db
      .select({
        judgeId: judgeRoundAssignments.judgeId,
        teamName: teams.name,
        labName: lab.name,
      })
      .from(judgeRoundAssignments)
      .innerJoin(teams, eq(teams.id, judgeRoundAssignments.teamId))
      .leftJoin(labTeams, eq(labTeams.teamId, teams.id))
      .leftJoin(lab, eq(lab.id, labTeams.labId))
      .orderBy(asc(teams.name));

    const assignments = judgeRoundId
      ? await baseQuery.where(
          eq(judgeRoundAssignments.judgeRoundId, judgeRoundId),
        )
      : await baseQuery;

    const byJudge = new Map<string, { teamName: string; labName: string }[]>();
    for (const row of assignments) {
      if (!byJudge.has(row.judgeId)) byJudge.set(row.judgeId, []);
      byJudge.get(row.judgeId)!.push({
        teamName: row.teamName,
        labName: row.labName ?? "Unassigned",
      });
    }

    let tableRows = "";
    for (const judge of allJudges) {
      const judgeTeams = byJudge.get(judge.judgeId) ?? [];
      const displayName = judge.judgeName || judge.judgeUsername;

      if (judgeTeams.length === 0) {
        tableRows += `
          <tr class="judge-start">
            <td class="judge-cell">${displayName}</td>
            <td>—</td>
            <td>—</td>
          </tr>`;
        continue;
      }

      judgeTeams.forEach((team, idx) => {
        if (idx === 0) {
          tableRows += `
          <tr class="judge-start">
            <td class="judge-cell" rowspan="${judgeTeams.length}">${displayName}</td>
            <td>${team.teamName}</td>
            <td>${team.labName}</td>
          </tr>`;
        } else {
          tableRows += `
          <tr>
            <td>${team.teamName}</td>
            <td>${team.labName}</td>
          </tr>`;
        }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Judge Allocations — ${roundLabel}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 32px 40px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    header {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    header h1 {
      font-size: 18px;
      font-weight: 700;
    }

    header p {
      font-size: 11px;
      color: #444;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 2px solid #000;
    }

    col.col-judge { width: 28%; }
    col.col-team  { width: 42%; }
    col.col-lab   { width: 30%; }

    thead tr {
      background: #000;
      color: #fff;
    }

    thead th {
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-right: 1px solid #ccc;
      border-bottom: 2px solid #000;
    }

    thead th:first-child { 
      border-right: 2px solid #000;
    }

    thead th:last-child { border-right: none; }

    tbody td {
      padding: 7px 10px;
      vertical-align: middle;
      border: 1px solid #ccc;
    }

    tr.judge-start td {
      border-top: 2px solid #000;
    }

    .judge-cell {
      font-weight: 600;
      border-right: 2px solid #000;
      vertical-align: top;
      padding-top: 8px;
    }

    .shade td { background: #f5f5f5; }

    @media print {
      body { margin: 0; padding: 16mm; }
      @page { margin: 0; size: A4 portrait; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Judge Allocations</h1>
    <p>Round: ${roundLabel}</p>
  </header>

  <table>
    <colgroup>
      <col class="col-judge" />
      <col class="col-team" />
      <col class="col-lab" />
    </colgroup>
    <thead>
      <tr>
        <th>Judge Name</th>
        <th>Teams</th>
        <th>Allocated Lab</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <script>
    const cells = document.querySelectorAll('.judge-cell');
    cells.forEach((cell, i) => {
      if (i % 2 === 1) {
        const span = parseInt(cell.getAttribute('rowspan') || '1', 10);
        let row = cell.closest('tr');
        for (let r = 0; r < span; r++) {
          if (row) { row.classList.add('shade'); row = row.nextElementSibling; }
        }
      }
    });
    window.addEventListener('load', () => window.print());
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
