"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

interface CollegeStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
  colleges: College[];
  loadingColleges: boolean;
}

/* remove select option on 1st row */

export function CollegeStep({
  form,
  onNext,
  colleges,
  loadingColleges,
}: CollegeStepProps) {
  const [search, setSearch] = useState("");

  // 1. Watch the current selection
  const selectedCollegeId = form.watch("collegeId");
  const formValues = form.getValues();

  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [otherCollegeName, setOtherCollegeName] = useState("");
  const [isSubmittingOther, setIsSubmittingOther] = useState(false);
  const [otherSuccess, setOtherSuccess] = useState(false);

  const handleOtherSubmit = async () => {
    if (!otherCollegeName.trim()) return;
    setIsSubmittingOther(true);

    try {
      const response = await fetch("/api/colleges/other", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customCollegeName: otherCollegeName,
          participantData: formValues,
        }),
      });

      if (response.ok) {
        setOtherSuccess(true);
      } else {
        console.error("Failed to submit other college");
      }
    } catch (error) {
      console.error("Error submitting other college:", error);
    } finally {
      setIsSubmittingOther(false);
    }
  };

  // 2. Filter AND Sort
  const filteredColleges = useMemo(() => {
    // A. Filter by search term
    let result = colleges;
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = colleges.filter(
        (c) =>
          (c.name?.toLowerCase() ?? "").includes(lowerSearch) ||
          (c.state?.toLowerCase() ?? "").includes(lowerSearch),
      );
    }

    // B. Sort: Move selected item to the top
    return [...result].sort((a, b) => {
      if (a.id === selectedCollegeId) return -1;
      if (b.id === selectedCollegeId) return 1;
      return 0;
    });
  }, [search, colleges, selectedCollegeId]);

  return (
    <div className="w-full flex flex-col font-pirate items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="collegeId"
        render={({ field }) => (
          <FormItem className="w-full max-w-2xl space-y-8">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight text-center tracking-wide">
                Select your College
              </FormLabel>
              <p className="text-white/80 text-lg font-crimson">
                Type to search, click to select
              </p>
            </div>

            {/* Search Input */}
            <FormControl>
              <div className="relative flex items-center">
                {/* Fixed alignment for the search icon */}
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full 
                    h-16            {/* Explicit height instead of padding */}
                    rounded-xl
                    border border-white/10
                    bg-white/90
                    px-4 pl-12      {/* Removed py-4 */}
                    text-xl font-medium font-pirate text-white
                    placeholder:text-white/80
                    leading-none
                    focus-visible:ring-1 focus-visible:ring-white
                    focus-visible:border-white
                    transition-all duration-200
                  "
                />
              </div>
            </FormControl>

            {/* List Container */}
            <div className="max-h-[40vh] overflow-y-auto pr-2 px-3 py-2 -mx-3 custom-scrollbar space-y-2 relative">
              {loadingColleges ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#10569c]/70 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[#10569c]" />
                  <p className="text-lg font-medium">Loading colleges...</p>
                </div>
              ) : (
                <>
                  {filteredColleges.length > 0 ? (
                    filteredColleges.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => {
                          field.onChange(college.id);
                          onNext();
                        }}
                        className={cn(
                          "group flex w-full min-h-16 items-center justify-between rounded-xl border border-white/10 bg-white/90 px-4 text-left transition-all duration-200 hover:bg-white/80 hover:border-white/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:scale-[1.02]",
                          field.value === college.id &&
                            "bg-white border-white/50 sticky top-0 z-10 backdrop-blur-md shadow-lg",
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xl font-medium font-pirate text-[#10569c] leading-none">
                            {college.name ?? "Unnamed College"}
                          </span>
                          <span className="text-sm text-[#10569c]/60 leading-none">
                            {college.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {field.value === college.id ? (
                            <Check className="h-5 w-5 text-[#10569c] animate-in zoom-in" />
                          ) : (
                            <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-[#10569c] bg-white px-2 py-1 rounded shadow-sm">
                              Select
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#10569c]/60 italic border border-dashed border-white/10 rounded-xl">
                      No college found matching "{search}"
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOtherModalOpen(true)}
                    className="group flex w-full min-h-16 items-center justify-between rounded-xl border border-dashed border-white/40 bg-white/90 px-4 text-left transition-all duration-200 hover:bg-white/80 hover:border-white/60 active:scale-[0.98] mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-medium font-pirate text-[#10569c] leading-none">
                        Other (Not listed)
                      </span>
                      <span className="text-sm text-[#10569c]/70 leading-none">
                        Click here to enter your college manually
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-white bg-[#10569c] px-2 py-1 rounded shadow-sm">
                        Request
                      </span>
                    </div>
                  </button>
                </>
              )}
            </div>

            <FormMessage className="text-[#e54d2e] text-2xl" />
          </FormItem>
        )}
      />

      {isOtherModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#10569c] border border-white/20 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            {otherSuccess ? (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#10569c]" />
                </div>
                <h3 className="text-3xl font-pirate text-white">
                  Request Sent!
                </h3>
                <p className="text-white/80 text-lg">
                  Our crew has been contacted. Please check out tomorrow.
                </p>
                <div className="italic text-white/50 text-sm mt-4">
                  (You may close this tab)
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-pirate text-white">
                    Add College
                  </h3>
                  <p className="text-white/80 text-sm">
                    Enter the full name of your college
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="Enter your college name"
                    value={otherCollegeName}
                    onChange={(e) => setOtherCollegeName(e.target.value)}
                    className="
                      w-full h-14 rounded-xl border border-white/20 bg-white/10
                      px-4 text-lg font-pirate text-white placeholder:text-white/50
                      focus-visible:ring-2 focus-visible:ring-white focus-visible:border-transparent
                    "
                    autoFocus
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOtherModalOpen(false)}
                      disabled={isSubmittingOther}
                      className="flex-1 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleOtherSubmit}
                      disabled={!otherCollegeName.trim() || isSubmittingOther}
                      className="flex-1 bg-white text-[#10569c] hover:bg-white/90"
                    >
                      {isSubmittingOther ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
