"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface PhoneStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function PhoneStep({ form, onNext }: PhoneStepProps) {
  return (
    <div className="w-full flex flex-col items-center animate-in font-pirate fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem className="w-full space-y-8 text-center">
            {/* Large, Bold Question */}
            <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight tracking-wide">
              Your phone number?
            </FormLabel>

            <FormControl>
              {/* Minimalist Underline Input */}
              <Input
                autoFocus
                type="tel" // Triggers numeric keyboard on mobile
                placeholder="e.g. 9876543210"
                className="
                  block w-full 
                  bg-transparent 
                  border-0 border-b-2 border-white/20 
                  rounded-none 
                  text-center text-3xl md:text-5xl font-light text-white 
                  placeholder:text-white/30 
                  focus-visible:ring-0 focus-visible:border-white
                  focus-visible:outline-none 
                  h-auto py-6 
                  transition-all duration-300
                  shadow-none
                  font-pirate
                "
                {...field}
                onKeyDown={(e) => e.key === "Enter" && onNext()}
              />
            </FormControl>

            <FormMessage className="text-[#e54d2e] text-2xl" />

            {/* "Press Enter" Hint */}
            <div className="flex items-center font-pirate text-xl justify-center gap-2 text-white/80 mt-4 animate-pulse">
              <span>
                Press <span className="font-bold text-white">Enter ↵</span>
              </span>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
