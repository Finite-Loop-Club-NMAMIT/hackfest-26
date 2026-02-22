"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { genderEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface GenderStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function GenderStep({ form, onNext }: GenderStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => containerRef.current?.focus(), 50);
    }
  }, []);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Need keydown on wrapper for enter selection.
    <div
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const currentVal = form.getValues("gender");
          const sortedGenders = [...genderEnum.enumValues].sort((a, b) => {
            if (a === currentVal) return -1;
            if (b === currentVal) return 1;
            return 0;
          });
          const valueToSelect = currentVal || sortedGenders[0];
          if (valueToSelect) {
            form.setValue("gender", valueToSelect);
            onNext();
          }
        }
      }}
      className="w-full flex flex-col items-center animate-in font-pirate fade-in slide-in-from-bottom-8 duration-700 focus:outline-none"
    >
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => {
          // Sort the genders so the selected one is dynamically at the top
          const sortedGenders = [...genderEnum.enumValues].sort((a, b) => {
            if (a === field.value) return -1;
            if (b === field.value) return 1;
            return 0;
          });

          return (
            <FormItem className="w-full max-w-lg space-y-8 flex flex-col items-center">
              {/* Header Section */}
              <div className="text-center w-full space-y-2">
                <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight tracking-wide block">
                  Select your gender
                </FormLabel>
                {/* Added accommodation helper text */}
                <p className="text-white/80 font-crimson text-xl tracking-wide">
                  This helps us manage your accommodation better
                </p>
              </div>

              <FormControl>
                <div className="flex flex-col space-y-2  px-3 py-2 -mx-3 pt-4 w-full relative">
                  {sortedGenders.map((gender, index) => {
                    const isSelected = field.value === gender;

                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => {
                          field.onChange(gender);
                          onNext();
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={cn(
                          "group flex w-full h-16 items-center justify-between rounded-xl border border-white/10 bg-white/90 px-4 text-left transition-all duration-200 hover:bg-white/80 hover:border-white/30 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:scale-[1.02]",
                          // Apply sticky highlighting only to the selected item
                          isSelected && "bg-white sticky top-0 z-10 shadow-md",
                        )}
                      >
                        {/* Gender Label - No conditional bolding here */}
                        <span className="text-xl font-bold font-crimson text-[#10569c] capitalize transition-all duration-200">
                          {gender}
                        </span>

                        {/* Selection Indicator */}
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            // Fixed the checkmark color so it's visible on the white background
                            <Check className="h-6 w-6 text-[#10569c] animate-in zoom-in" />
                          ) : (
                            <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest text-[#10569c] bg-white border border-[#10569c]/20 px-2 py-1 rounded shadow-sm">
                              Select
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormControl>

              <FormMessage className="text-[#e54d2e] text-2xl" />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
