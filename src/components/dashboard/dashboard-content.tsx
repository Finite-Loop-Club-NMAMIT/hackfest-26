"use client";

import type { Session } from "next-auth";
import { Suspense } from "react";
import { AdminDashboard } from "~/components/dashboard/admin/admin-dashboard";
import { DashboardTabs } from "~/components/dashboard/dashboard-tabs";
import { TeamsTab } from "../tabs";
import { EvaluatorTab } from "./tabs/Evaluator";
import { FinalJudgeTab } from "./tabs/FinalJudge";
import { JudgeTab } from "./tabs/Judge";
import { ManageEventsTab } from "./tabs/ManageEvents";
import { MentorTab } from "./tabs/Mentor";
import { SelectorTab } from "./tabs/Selector";

type DashboardContentProps = {
  permissions: {
    // Role-based checks
    isAdmin: boolean;
    // Permission-based checks
    canManageSettings: boolean;
    canManageRoles: boolean;
    canViewAllTeams: boolean;
    canViewTop60: boolean;
    canScoreSubmissions: boolean;
    canRemarkSubmissions: boolean;
    canPromoteSelection: boolean;
    canViewSelection: boolean;
    canMarkAttendance: boolean;
    canViewResults: boolean;
    canManageEvents: boolean;
  };
  session: Session;
};

export function DashboardContent({
  permissions,
  session,
}: DashboardContentProps) {
  const {
    isAdmin,
    canViewAllTeams,
    canScoreSubmissions,
    canRemarkSubmissions,
    canPromoteSelection,
    canViewSelection,
    canViewTop60,
    canViewResults,
    canManageEvents,
  } = permissions;

  const tabs = [
    {
      id: "admin",
      label: "Admin",
      hasAccess: isAdmin,
      content: <AdminDashboard />,
    },
    {
      id: "teams",
      label: "Teams",
      hasAccess: isAdmin || canViewAllTeams,
      content: <TeamsTab />,
    },
    {
      id: "events",
      label: "Events",
      hasAccess: isAdmin || canManageEvents,
      content: <ManageEventsTab session={session} />,
    },
    {
      id: "evaluator",
      label: "Evaluator",
      hasAccess: isAdmin || (canScoreSubmissions && canViewAllTeams),
      content: <EvaluatorTab />,
    },
    {
      id: "selector",
      label: "Selection",
      hasAccess: isAdmin || (canPromoteSelection && canViewSelection),
      content: <SelectorTab />,
    },
    {
      id: "judge",
      label: "Judge",
      hasAccess: isAdmin || (canScoreSubmissions && canViewTop60),
      content: <JudgeTab />,
    },
    {
      id: "finalJudge",
      label: "Final Judge",
      hasAccess: isAdmin || (canScoreSubmissions && canViewResults),
      content: <FinalJudgeTab />,
    },
    {
      id: "mentor",
      label: "Mentor",
      hasAccess: isAdmin || canRemarkSubmissions,
      content: <MentorTab />,
    },
  ];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <DashboardTabs tabs={tabs} defaultTab={isAdmin ? "admin" : undefined} />
    </Suspense>
  );
}
