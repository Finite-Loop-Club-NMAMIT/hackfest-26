"use client";

import { SupportTable } from "~/components/dashboard/tables/support-table";

export function SupportTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
        <p className="text-muted-foreground">
          View and manage technical issues reported by participants.
        </p>
      </div>

      <SupportTable />
    </div>
  );
}
