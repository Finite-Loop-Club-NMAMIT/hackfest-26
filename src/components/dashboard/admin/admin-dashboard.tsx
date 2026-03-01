"use client";

import { useEffect, useState } from "react";
import type { UserPermissions } from "~/components/dashboard/tables/teams-table";
import {
  AllocationsTab,
  AttendanceTab,
  MealsTab,
  ResultsTab,
  RolesTab,
  SelectionsTab,
  SettingsTab,
  SubmissionsTab,
  TeamsTab,
} from "~/components/tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PaymentsTable } from "../tables/payments-table";
import { QuickboardTab } from "../tabs/QuickBoard";

export type SubTabConfig = {
  id: string;
  label: string;
  component: React.ReactNode;
};

function getSubTabs(permissions: UserPermissions): SubTabConfig[] {
  return [
    {
      id: "quickboard",
      label: "Quickboard",
      component: <QuickboardTab />,
    },
    {
      id: "teams",
      label: "Teams",
      component: <TeamsTab permissions={permissions} />,
    },
    {
      id: "payments",
      label: "Payments",
      component: <PaymentsTable />,
    },
    {
      id: "submissions",
      label: "Submissions",
      component: <SubmissionsTab />,
    },
    {
      id: "selection",
      label: "Selection",
      component: <SelectionsTab />,
    },
    {
      id: "results",
      label: "Results",
      component: <ResultsTab />,
    },
    {
      id: "attendance",
      label: "Attendance",
      component: <AttendanceTab />,
    },
    {
      id: "meals",
      label: "Meals",
      component: <MealsTab />,
    },
    {
      id: "allocations",
      label: "Allocations",
      component: <AllocationsTab />,
    },
    {
      id: "roles",
      label: "Roles",
      component: <RolesTab />,
    },
    {
      id: "settings",
      label: "Settings",
      component: <SettingsTab />,
    },
  ];
}

export function AdminDashboard({
  permissions,
}: {
  permissions: UserPermissions;
}) {
  const [activeTab, setActiveTab] = useState("quickboard");
  const [isClient, setIsClient] = useState(false);

  const subTabs = getSubTabs(permissions);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("adminActiveTab");
    if (stored && subTabs.some((t) => t.id === stored)) {
      setActiveTab(stored);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("adminActiveTab", value);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Full system access and management
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-between h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {subTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {subTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
