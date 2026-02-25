import type { Session } from "next-auth";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";

type DashboardContentProps = {
  permissions: {
    isAdmin: boolean;
    canViewAllTeams: boolean;
    canScoreSubmissions: boolean;
    canRemarkSubmissions: boolean;
    canPromoteSelection: boolean;
    canViewSelection: boolean;
    canViewTop60: boolean;
    canViewResults: boolean;
    canManageEvents: boolean;
  };
  session: Session | null;
};
export function EvaluatorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Evaluator</h2>
        <p className="text-muted-foreground">
          Score and review idea submissions before the hackathon
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Score Submissions</CardTitle>
            <CardDescription>
              Rate team idea submissions with criteria-based scoring
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Scoring interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Add Remarks</CardTitle>
            <CardDescription>
              Provide feedback and remarks on submissions
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Remarks interface coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
