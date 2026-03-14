"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type EvaluatorCandidate = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  isActive: boolean;
  hasEvaluatorRole: boolean;
};

type EvaluatorSettingsResponse = {
  evaluatorRoleId: string;
  users: EvaluatorCandidate[];
};

export function EvaluatorSettingsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<EvaluatorCandidate[]>([]);
  const [evaluatorRoleId, setEvaluatorRoleId] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/submissions/settings", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch evaluator settings");
      }

      const data: EvaluatorSettingsResponse = await res.json();
      setUsers(data.users);
      setEvaluatorRoleId(data.evaluatorRoleId);
    } catch {
      toast.error("Failed to load evaluator settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const assignEvaluator = async (userId: string) => {
    if (!evaluatorRoleId) {
      toast.error("Evaluator role not found");
      return;
    }

    try {
      setSavingUserId(userId);
      const res = await fetch("/api/dashboard/user-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardUserId: userId,
          roleId: evaluatorRoleId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to assign evaluator role");
      }

      toast.success("Evaluator role assigned");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, hasEvaluatorRole: true } : u,
        ),
      );
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign role",
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const removeEvaluator = async (userId: string) => {
    if (!evaluatorRoleId) {
      toast.error("Evaluator role not found");
      return;
    }

    try {
      setSavingUserId(userId);
      const res = await fetch(
        `/api/dashboard/user-roles?userId=${userId}&roleId=${evaluatorRoleId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to remove evaluator role");
      }

      toast.success("Evaluator role removed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, hasEvaluatorRole: false } : u,
        ),
      );
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove role",
      );
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Evaluator Access Settings</h3>
        <p className="text-sm text-muted-foreground">
          Assign or remove the EVALUATOR role for dashboard users.
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evaluator</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No dashboard users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.username}
                      {user.email ? ` · ${user.email}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "outline"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.hasEvaluatorRole ? "success" : "outline"}
                    >
                      {user.hasEvaluatorRole ? "Assigned" : "Not assigned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.hasEvaluatorRole ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={savingUserId === user.id}
                        onClick={() => removeEvaluator(user.id)}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={savingUserId === user.id}
                        onClick={() => assignEvaluator(user.id)}
                      >
                        Assign Evaluator
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
