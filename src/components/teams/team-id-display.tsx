"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

export function TeamIdDisplay({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false);

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
    // Changed bg-zinc-900/90 -> bg-black/40 for that "Smoked Glass" look
    <div className="bg-transparent border border-white/20 rounded-lg p-5 shadow-2xl backdrop-blur-xl max-w-md transition-all hover:bg-black/10">
      <p className="text-xs text-white/70 mb-1.5 font-medium">
        Team ID (share this to invite members):
      </p>

      <div className="flex items-center gap-3">
        {/* ID: Monospace, Bold, White */}
        <code className="text-sm md:text-base font-mono font-bold text-white tracking-wide flex-1 truncate drop-shadow-sm">
          {teamId}
        </code>

        {/* Copy Button: Glassy Outline */}
        <Button
          onClick={copyToClipboard}
          size="sm"
          variant="outline"
          className="
            h-8 px-3 shrink-0
            bg-white/10 hover:bg-white/20
            border-white/20 hover:border-white/40
            text-white 
            backdrop-blur-sm
            transition-all
          "
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" />
              <span className="text-green-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
