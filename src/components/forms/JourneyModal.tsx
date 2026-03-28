"use client";

import {
  Anchor,
  Eye,
  FileText,
  Loader2,
  Send,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

const JOURNEY_STEPS = [
  {
    icon: Users,
    title: "Form Your Crew",
    description: "Create your team and invite your crew members to join.",
    accent: "#3b82f6",
  },
  {
    icon: FileText,
    title: "Prepare Your Map",
    description: "Download the PPT template and craft your idea presentation.",
    accent: "#8b5cf6",
  },
  {
    icon: Send,
    title: "Submit Your Idea by March 20, 11:59 PM",
    description: "Submit your polished idea and wait for the results.",
    accent: "#06b6d4",
  },
  {
    icon: Eye,
    title: "Internal Expert Review",
    description:
      "Our panel of industry experts and faculty reviews all submissions and selects the top 100 teams.",
    note: "This stage is not publicly announced.",
    accent: "#f59e0b",
  },
  {
    icon: Trophy,
    title: "Final Shortlist - March 30",
    description:
      "Previous year's judges select the top 60 shortlisted teams. Results announced on March 15.",
    accent: "#10b981",
  },
];

interface JourneyModalProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  isSubmitting: boolean;
}

export function JourneyModal({
  open,
  onClose,
  onProceed,
  isSubmitting,
}: JourneyModalProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stagger the step reveal
  useEffect(() => {
    if (!open) {
      setVisibleSteps(0);
      return;
    }
    if (visibleSteps < JOURNEY_STEPS.length) {
      const timer = setTimeout(
        () => setVisibleSteps((v) => v + 1),
        visibleSteps === 0 ? 400 : 350,
      );
      return () => clearTimeout(timer);
    }
  }, [open, visibleSteps]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="
          max-w-md sm:max-w-lg w-[95vw]
          max-h-[90vh]
          bg-linear-to-b from-[#0a2a52] via-[#0d3868] to-[#071e3d]
          border border-white/10
          shadow-[0_0_60px_rgba(16,86,156,0.4)]
          rounded-2xl p-0 overflow-hidden
          [&>button]:hidden
        "
      >
        <DialogTitle className="sr-only">Your Hackfest Journey</DialogTitle>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors !block"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-7 pb-4 text-center">
          <div className="absolute inset-0 bg-linear-to-b from-white/4 to-transparent pointer-events-none" />
          <div className="relative">
            <Anchor className="w-8 h-8 text-white/40 mx-auto mb-2 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-pirate text-white tracking-wide drop-shadow-lg">
              Your Voyage Ahead
            </h2>
            <p className="text-white/50 text-sm font-crimson mt-1.5">
              Here's what happens after you register
            </p>
          </div>
        </div>

        {/* Steps */}
        <div
          ref={scrollRef}
          className="px-6 pb-2 overflow-y-auto max-h-[55vh] scrollbar-none"
        >
          <div className="relative pl-8 pb-2">
            {/* Connector line */}
            <div
              className="absolute left-[13px] top-2 bottom-8 w-[2px] rounded-full transition-all duration-1000"
              style={{
                background:
                  "linear-gradient(to bottom, #3b82f6, #8b5cf6, #06b6d4, #f59e0b, #10b981)",
                opacity: visibleSteps > 0 ? 0.5 : 0,
                height: `${(Math.min(visibleSteps, JOURNEY_STEPS.length) / JOURNEY_STEPS.length) * 100}%`,
              }}
            />

            {JOURNEY_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isVisible = i < visibleSteps;

              return (
                <div
                  key={step.title}
                  className="relative mb-5 last:mb-0 transition-all duration-500"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translateY(0) scale(1)"
                      : "translateY(16px) scale(0.95)",
                    transitionDelay: `${i * 50}ms`,
                  }}
                >
                  {/* Dot */}
                  <div
                    className="absolute -left-8 top-[2px] w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                    style={{
                      borderColor: isVisible
                        ? step.accent
                        : "rgba(255,255,255,0.1)",
                      background: isVisible
                        ? `${step.accent}20`
                        : "rgba(255,255,255,0.03)",
                      boxShadow: isVisible
                        ? `0 0 12px ${step.accent}40`
                        : "none",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5 transition-colors duration-300"
                      style={{
                        color: isVisible
                          ? step.accent
                          : "rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>

                  {/* Content card */}
                  <div
                    className="rounded-xl p-3.5 border transition-all duration-500"
                    style={{
                      background: isVisible
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                      borderColor: isVisible
                        ? `${step.accent}25`
                        : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: step.accent }}
                      >
                        Step {i + 1}
                      </span>
                    </div>
                    <h3 className="text-white font-pirate text-base sm:text-lg leading-snug tracking-wide">
                      {step.title}
                    </h3>
                    <p className="text-white/55 text-sm font-crimson mt-1 leading-relaxed">
                      {step.description}
                    </p>
                    {step.note && (
                      <p className="text-amber-400/70 text-xs font-crimson mt-1.5 italic flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-amber-400/70" />
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onProceed}
            disabled={isSubmitting}
            className="
              w-full h-13 rounded-xl font-pirate text-lg tracking-wide
              transition-all duration-300 cursor-pointer
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 text-white
            "
            style={{
              background: "linear-gradient(135deg, #10569c, #3b82f6)",
              boxShadow:
                "0 0 30px rgba(16,86,156,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              "Set Sail"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
