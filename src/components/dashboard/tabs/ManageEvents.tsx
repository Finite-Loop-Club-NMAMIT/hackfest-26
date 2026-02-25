"use client";

import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { hasPermission } from "~/lib/auth/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import type { SubTabConfig } from "../admin/admin-dashboard";
import MarkAttendanceTab from "../events/attendance";
import CreateEventTab from "../events/create-event";
import EventListTab from "../events/event-list";
import UpdateEventTab from "../events/update-event";

export function ManageEventsTab({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState("eventList");
  const [isClient, setIsClient] = useState(false);

  const SUB_TABS: ({ permission: string } & SubTabConfig)[] = [
    {
      id: "all",
      label: "All Events",
      permission: "event:read_all",
      component: (
        <EventListTab
          assigned={false}
          setTab={setActiveTab}
          session={session}
        />
      ),
    },
    {
      id: "assigned",
      label: "Assigned",
      permission: "event:read",
      component: (
        <EventListTab assigned={true} setTab={setActiveTab} session={session} />
      ),
    },
    {
      id: "create",
      permission: "event:create",
      label: "Create",
      component: <CreateEventTab setTab={setActiveTab} />,
    },
    {
      id: "update",
      permission: "event:update",
      label: "Update",
      component: <UpdateEventTab setTab={setActiveTab} />,
    },
    {
      id: "attendance",
      permission: "event:attendance",
      label: "Mark Attendance",
      component: <MarkAttendanceTab setTab={setActiveTab} />,
    },
  ];

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("manageEventsActiveTab");
    if (stored && ["manageEvents", "eventSchedule"].includes(stored)) {
      setActiveTab(stored);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("manageEventsActiveTab", value);
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
        <h2 className="text-3xl font-bold tracking-tight">Manage Events</h2>
        <p className="text-muted-foreground">
          Manage events and schedules for the hackathon
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
        defaultValue="eventList"
      >
        <TabsList className="w-fit justify-between h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {SUB_TABS.map((tab) => {
            return (
              hasPermission(session.dashboardUser, tab.permission) && (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              )
            );
          })}
        </TabsList>

        {SUB_TABS.map((tab) => {
          return (
            hasPermission(session.dashboardUser, tab.permission) && (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                {tab.component}
              </TabsContent>
            )
          );
        })}
      </Tabs>
    </div>
  );
}
