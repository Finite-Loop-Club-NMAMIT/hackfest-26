import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { apiFetch } from "~/lib/fetcher";
import type { EventMember, EventTeam } from "./layout";

export function TeamDetailsDialog({
  team,
  members,
  isLeader,
  open,
  onOpenChange,
  fetchEvents,
}: {
  team: EventTeam;
  members: EventMember[];
  isLeader: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchEvents: () => Promise<void>;
}) {
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [copied, setCopied] = useState(false);
  const isConfirmed = team.isComplete;

  const maskedId = (() => {
    const id = team.id;
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}${"•".repeat(6)}${id.slice(-4)}`;
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(team.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = async (memberId: string) => {
    setKickingId(memberId);
    try {
      await apiFetch(`/api/events/teams/${team.id}/kick`, {
        method: "POST",
        body: JSON.stringify({ memberId }),
      });
      await fetchEvents();
    } catch {
      console.error("Failed to kick member. Please try again.");
    } finally {
      setKickingId(null);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await apiFetch(`/api/events/teams/${team.id}/confirm`, {
        method: "POST",
      });
      await fetchEvents();
      toast.success("Team confirmed successfully!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to confirm team. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/events/teams/${team.id}/delete`, {
        method: "DELETE",
      });
      await fetchEvents();
      toast.success("Team deleted.");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete team. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await apiFetch(`/api/events/teams/${team.id}/leave`, {
        method: "POST",
      });
      await fetchEvents();
      toast.success("You have left the team.");
      onOpenChange(false);
    } catch {
      toast.error("Failed to leave team. Please try again.");
    } finally {
      setLeaving(false);
    }
  };

  const allMembers = [
    { ...members.find((m) => m.isLeader) },
    ...members.filter((m) => !m.isLeader),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1823] border border-[#39577c] text-white p-0 overflow-hidden max-w-md w-full rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Team Details</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#39577c]/50">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#f4d35e]/60" />
            <span className="text-sm font-semibold tracking-widest uppercase text-[#f4d35e]/60">
              Team Details
            </span>
          </div>
          {isConfirmed && (
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-2.5 py-0.5">
              <Shield size={11} />
              Confirmed
            </span>
          )}
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Team name */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-1">
              Team Name
            </p>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
          </div>

          {/* Team ID */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#133c55]/40 border border-[#39577c]/60">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                Team ID
              </span>
              <span className="text-sm font-mono text-white/70 tracking-wider">
                {maskedId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-2 rounded-lg text-white/30 hover:text-[#f4d35e] hover:bg-[#f4d35e]/10 border border-transparent hover:border-[#f4d35e]/20 transition-all duration-150"
              title="Copy Team ID"
            >
              {copied ? (
                <Check size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>

          {/* Members list */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60 mb-1">
              Members · {allMembers.length}
            </p>

            {allMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  member.isLeader
                    ? "bg-[#f4d35e]/8 border-[#f4d35e]/30"
                    : "bg-[#133c55]/40 border-[#39577c]/60"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    member.isLeader
                      ? "bg-[#f4d35e]/20 text-[#f4d35e]"
                      : "bg-[#133c55] text-white/60"
                  }`}
                >
                  {member.name?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {member.name}
                    </span>
                    {member.isLeader && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#f4d35e] bg-[#f4d35e]/15 border border-[#f4d35e]/30 rounded-full px-2 py-0.5 shrink-0">
                        <Crown size={9} />
                        Leader
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 truncate">
                    {member.email}
                  </span>
                </div>

                {/* Kick button — only for non-leaders, only if leader viewing, only if not confirmed */}
                {isLeader && !member.isLeader && !isConfirmed && (
                  <button
                    type="button"
                    onClick={() => handleKick(member.id ?? "")}
                    disabled={kickingId === member.id}
                    className="shrink-0 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove from team"
                  >
                    {kickingId === member.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserMinus size={15} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Leave team — only for non-leaders when not confirmed */}
          {!isLeader && !isConfirmed && (
            <Button
              onClick={handleLeave}
              disabled={leaving}
              variant="outline"
              className="w-full border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/60 hover:text-red-300 transition-all duration-200 cursor-pointer"
            >
              {leaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Leaving...
                </span>
              ) : (
                "Leave Team"
              )}
            </Button>
          )}

          {/* Action buttons — only for leader */}
          {isLeader && (
            <div className="flex gap-3 pt-1">
              {!isConfirmed && (
                <Button
                  onClick={handleDelete}
                  disabled={deleting || confirming}
                  variant="outline"
                  className="flex-1 border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/60 hover:text-red-300 transition-all duration-200 cursor-pointer"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete Team"
                  )}
                </Button>
              )}

              {!isConfirmed && (
                <Button
                  onClick={handleConfirm}
                  disabled={confirming || deleting}
                  className="flex-1 bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all duration-200 cursor-pointer"
                >
                  {confirming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    "Confirm Team"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
