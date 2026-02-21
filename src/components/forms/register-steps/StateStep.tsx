"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { stateEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface StateStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function StateStep({ form, onNext }: StateStepProps) {
  const [search, setSearch] = useState("");

  // 1. Get the current selected value
  const selectedState = form.watch("state");

  // 2. Filter AND Sort based on selection
  const filteredStates = useMemo(() => {
    // A. Filter by search term first
    const options = search
      ? stateEnum.enumValues.filter((state) =>
          state.toLowerCase().includes(search.toLowerCase()),
        )
      : stateEnum.enumValues;

    // B. Sort: Move selected item to the top
    return [...options].sort((a, b) => {
      if (a === selectedState) return -1; // 'a' moves to top
      if (b === selectedState) return 1; // 'b' moves to top
      return 0; // Keep original order for others
    });
  }, [search, selectedState]);

  return (
    <div className="w-full flex flex-col font-pirate items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem className="w-full max-w-lg space-y-8">
            {/* Header Section */}
            <div className="flex flex-col font-pirate items-center justify-center text-center space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight text-center tracking-wide">
                Select your state
              </FormLabel>
              <p className="text-white/80 text-lg">
                Type to search, click to select
              </p>
            </div>

            {/* Search Input */}
            <FormControl>
              <div className="relative flex items-center">
                {/* Use top-1/2 and -translate-y-1/2 for perfect vertical centering */}
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white" />
                <Input
                  autoFocus
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

            {/* Scrollable List of Options */}
            <div className="max-h-[40vh] overflow-y-auto px-3 py-2 -mx-3 custom-scrollbar space-y-2">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      field.onChange(state);
                      onNext();
                    }}
                    className={cn(
                      "group flex w-full h-16 items-center justify-between rounded-xl border border-white/10 bg-white/90 px-4 text-left transition-all hover:bg-white/80 hover:border-white/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:scale-[1.02]",
                      field.value === state &&
                        "bg-white border-white/50 ring-1 ring-[#10569c]/50 sticky top-0 z-10 shadow-lg",
                    )}
                  >
                    {/* State Name */}
                    <span className="text-xl font-medium font-pirate text-[#10569c] transition-all duration-200">
                      {state}
                    </span>

                    <div className="flex items-center gap-3">
                      {field.value === state ? (
                        /* Selected → Always show accent tick */
                        <Check className="h-5 w-5 text-[#10569c] animate-in zoom-in" />
                      ) : (
                        /* Not selected → Show Select only on hover */
                        <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-[#10569c] bg-white px-2 py-1 rounded">
                          Select
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-white/40 italic">
                  No state found matching "{search}"
                </div>
              )}
            </div>

            <FormMessage className="text-[#e54d2e] text-2xl" />
          </FormItem>
        )}
      />
    </div>
  );
}
