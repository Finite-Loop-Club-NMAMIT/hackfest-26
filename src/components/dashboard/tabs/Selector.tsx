import { Card, CardDescription, CardTitle } from "~/components/ui/card";

export function SelectorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Selection</h2>
        <p className="text-muted-foreground">
          Shortlist teams for Top 60 and Top 10 selection
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Selection Window</CardTitle>
            <CardDescription>
              Promote or demote teams through selection stages
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Selection interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">View Status</CardTitle>
            <CardDescription>
              Current selection status and team rankings
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Status view coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
