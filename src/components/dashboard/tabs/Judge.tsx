import { Card, CardDescription, CardTitle } from "~/components/ui/card";

export function JudgeTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judge</h2>
        <p className="text-muted-foreground">
          Live judging during the hackathon
        </p>
      </div>

      <Card>
        <div className="p-6">
          <CardTitle className="mb-2">Score Teams</CardTitle>
          <CardDescription>
            Judge Top 60 teams with criteria-based scoring
          </CardDescription>
          <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
            Judging interface coming soon...
          </div>
        </div>
      </Card>
    </div>
  );
}
