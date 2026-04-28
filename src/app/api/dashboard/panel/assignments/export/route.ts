import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUsers,
  lab,
  labTeams,
  panelists,
  panelRoundAssignments,
  selected,
  teams,
} from "~/db/schema";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const panelRoundId = searchParams.get("panelRoundId");

    let roundLabel = "All Rounds";
    if (panelRoundId) {
      const round = await db.query.panelRounds.findFirst({
        where: (r, { eq }) => eq(r.id, panelRoundId),
      });
      if (round) roundLabel = round.name;
    }

    const allPanelists = await db
      .select({
        panelistId: panelists.id,
        panelistName: dashboardUsers.name,
        panelistUsername: dashboardUsers.username,
      })
      .from(panelists)
      .innerJoin(
        dashboardUsers,
        eq(dashboardUsers.id, panelists.dashboardUserId),
      )
      .orderBy(asc(dashboardUsers.name));

    const baseQuery = db
      .select({
        panelistId: panelRoundAssignments.panelistId,
        teamName: teams.name,
        teamNo: selected.teamNo,
        labName: lab.name,
      })
      .from(panelRoundAssignments)
      .innerJoin(teams, eq(teams.id, panelRoundAssignments.teamId))
      .innerJoin(selected, eq(selected.teamId, teams.id))
      .leftJoin(labTeams, eq(labTeams.teamId, teams.id))
      .leftJoin(lab, eq(lab.id, labTeams.labId))
      .orderBy(asc(selected.teamNo));

    const assignments = panelRoundId
      ? await baseQuery.where(
          eq(panelRoundAssignments.panelRoundId, panelRoundId),
        )
      : await baseQuery;

    const byPanelist = new Map<
      string,
      { teamNo: number | null; teamName: string; labName: string }[]
    >();
    for (const row of assignments) {
      if (!byPanelist.has(row.panelistId)) byPanelist.set(row.panelistId, []);
      byPanelist.get(row.panelistId)?.push({
        teamNo: row.teamNo,
        teamName: row.teamName,
        labName: row.labName ?? "Unassigned",
      });
    }

    let tableRows = "";
    for (const panelist of allPanelists) {
      const panelistTeams = byPanelist.get(panelist.panelistId) ?? [];
      const displayName = panelist.panelistName || panelist.panelistUsername;

      if (panelistTeams.length === 0) {
        tableRows += `
          <tr class="panelist-start">
            <td class="panelist-cell">${displayName}</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
          </tr>`;
        continue;
      }

      panelistTeams.forEach((team, idx) => {
        const teamNoDisplay = team.teamNo ?? "—";
        if (idx === 0) {
          tableRows += `
          <tr class="panelist-start">
            <td class="panelist-cell" rowspan="${panelistTeams.length}">${displayName}</td>
            <td>${teamNoDisplay}</td>
            <td>${team.teamName}</td>
            <td>${team.labName}</td>
          </tr>`;
        } else {
          tableRows += `
          <tr>
            <td>${teamNoDisplay}</td>
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
  <title>Panel Allocations — ${roundLabel}</title>
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

    col.col-panelist { width: 25%; }
    col.col-no       { width: 10%; }
    col.col-team     { width: 37%; }
    col.col-lab      { width: 28%; }

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

    tr.panelist-start td {
      border-top: 2px solid #000;
    }

    .panelist-cell {
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
    <h1>Panel Allocations</h1>
    <p>Round: ${roundLabel}</p>
  </header>

  <table>
    <colgroup>
      <col class="col-panelist" />
      <col class="col-no" />
      <col class="col-team" />
      <col class="col-lab" />
    </colgroup>
    <thead>
      <tr>
        <th>Panelist Name</th>
        <th>Team No</th>
        <th>Team Name</th>
        <th>Allocated Lab</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <script>
    const cells = document.querySelectorAll('.panelist-cell');
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
