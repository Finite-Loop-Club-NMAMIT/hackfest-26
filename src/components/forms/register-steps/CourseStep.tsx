"use client";

import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { courseEnum } from "~/db/enum";
import { cn } from "~/lib/utils";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface CourseStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function CourseStep({ form, onNext }: CourseStepProps) {
  return (
    <div className="w-full flex flex-col font-pirate items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="course"
        render={({ field }) => {
          // Sort the courses so the selected one is always structurally at the top
          const sortedCourses = [...courseEnum.enumValues].sort((a, b) => {
            if (a === field.value) return -1;
            if (b === field.value) return 1;
            return 0;
          });

          return (
            <FormItem className="w-full max-w-lg space-y-8 flex flex-col items-center">
              {/* Header Section */}
              <div className="text-center w-full">
                <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight tracking-wide block">
                  What course are you in?
                </FormLabel>
              </div>

              <FormControl>
                <div className="w-full max-h-[40vh]  px-3 py-2 -mx-3 overflow-y-auto pr-2 custom-scrollbar space-y-2 relative">
                  {sortedCourses.map((course, index) => {
                    const isSelected = field.value === course;

                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => {
                          field.onChange(course);
                          onNext();
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={cn(
                          "group flex w-full h-16 items-center justify-between rounded-xl border border-white/10 bg-white/90 px-4 text-left transition-all duration-200 hover:bg-white/80 hover:border-white/30 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:scale-[1.02]",
                          // Apply sticky & highlighting only to the selected item
                          isSelected && "bg-white sticky top-0 z-10 shadow-md",
                        )}
                      >
                        {/* Course Name */}
                        <span
                          className={cn(
                            "text-xl font-medium font-pirate transition-all duration-200 text-[#10569c]",
                          )}
                        >
                          {course}
                        </span>

                        {/* Selection Indicator */}
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            // Changed to blue so it shows up on the white background
                            <Check className="h-6 w-6 text-[#10569c] animate-in zoom-in" />
                          ) : (
                            // Only show "Select" on items that aren't currently selected
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
