import { Card, CardDescription, CardTitle } from "~/components/ui/card";

export function MentorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor</h2>
        <p className="text-muted-foreground">
          Provide remarks and feedback to teams (no scoring)
        </p>
      </div>

      <Card>
        <div className="p-6">
          <CardTitle className="mb-2">Add Remarks</CardTitle>
          <CardDescription>
            Provide helpful feedback to Top 60 teams
          </CardDescription>
          <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
            Remarks interface coming soon...
          </div>
        </div>
      </Card>
    </div>
  );
}
