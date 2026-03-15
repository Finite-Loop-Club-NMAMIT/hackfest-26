import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import {
  getCollegeRankingsBySelections,
  getDashboardStats,
  getRegistrationTrends,
  getStatesConfirmedStats,
  getStatesTotalStats,
} from "~/db/services/dashboard-stats";

export const GET = permissionProtected(["dashboard:access"], async () => {
  try {
    const [
      quickStats,
      statesConfirmedStats,
      statesTotalStats,
      collegeRankings,
      registrationTrends,
    ] = await Promise.all([
      getDashboardStats(),
      getStatesConfirmedStats(),
      getStatesTotalStats(),
      getCollegeRankingsBySelections(),
      getRegistrationTrends(),
    ]);

    return NextResponse.json(
      {
        quickStats,
        statesConfirmedStats,
        statesTotalStats,
        collegeRankings,
        registrationTrends,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
