import { Card, CardDescription, CardTitle } from "~/components/ui/card";

export function FinalJudgeTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Final Judge</h2>
        <p className="text-muted-foreground">
          Final scoring and results after the hackathon
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Final Scoring</CardTitle>
            <CardDescription>
              Complete final scores for all judged teams
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Final scoring interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">View Results</CardTitle>
            <CardDescription>
              See aggregated scores and rankings
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Results view coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
