"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

export function TeamIdDisplay({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false);

  // Helper to shorten the ID (e.g., "5ff1bb00...2304aa0d")
  const shortenedId = `${teamId.slice(0, 8)}...${teamId.slice(-8)}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(teamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Team ID copied to clipboard");
    } catch (_error) {
      toast.error("Failed to copy", {
        description: "Please try copying manually.",
      });
    }
  }

  return (
    <div className="bg-white/90 border border-[#10569c]/20 rounded-xl p-3 shadow-md backdrop-blur-md transition-all hover:bg-white flex flex-col items-start gap-2 min-w-[280px]">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex flex-col">
          <p className="text-[10px] text-[#10569c]/60 uppercase tracking-widest font-bold">
            Team ID
          </p>
          <code className="text-sm font-crimson font-bold text-[#10569c] tracking-wide">
            {shortenedId}
          </code>
        </div>

        <Button
          onClick={copyToClipboard}
          size="sm"
          variant="ghost"
          className="
            h-8 px-2 rounded-lg
            text-[#10569c]/70 hover:text-[#10569c] hover:bg-[#10569c]/10
            transition-all
          "
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
