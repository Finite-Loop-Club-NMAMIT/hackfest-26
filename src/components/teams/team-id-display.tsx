"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
    <button
      type="button"
      onClick={copyToClipboard}
      className="bg-white/90 border border-[#10569c]/20 rounded-xl p-3 shadow-md backdrop-blur-md cursor-pointer flex flex-col items-start gap-2 min-w-[280px] w-full text-left"
      title="Click to copy Team ID"
    >
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex flex-col">
          <p className="text-[10px] text-[#10569c]/60 uppercase tracking-widest font-bold m-0 leading-tight">
            Team ID
          </p>
          <code className="text-sm font-crimson font-bold text-[#10569c] tracking-wide m-0 leading-tight">
            {shortenedId}
          </code>
        </div>

        <div
          className="
            flex items-center justify-center
            h-8 w-8 rounded-lg shrink-0
            text-[#10569c]/70 hover:text-[#10569c] bg-[#10569c]/5
            transition-all
          "
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </div>
      </div>
    </button>
  );
}
