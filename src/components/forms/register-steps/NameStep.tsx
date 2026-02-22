"use client";

import { useEffect } from "react";
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

interface NameStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

//we let them enter full name, if its too long, we ask them to enter a additional name (to be printed in ID) which will have 15 letters limit

export function NameStep({ form, onNext }: NameStepProps) {
  const currentName = form.watch("name") || "";
  const needsAlias = currentName.length > 15;

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => form.setFocus("name"), 50);
    }
  }, [form]);

  return (
    <div className="w-full flex md:pt-12 flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="w-full space-y-6">
            {/* Large, Bold Question */}
            <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight tracking-wide">
              What's your name?
            </FormLabel>

            <FormControl>
              {/* Minimalist Underline Input */}
              <Input
                {...field}
                onChange={(e) => {
                  const val = e.target.value.replace(/[0-9]/g, "");
                  field.onChange(val);
                }}
                className="
                  block w-full 
                  bg-transparent 
                  border-0 border-b-2 border-white/20 
                  rounded-none 
                  text-center text-3xl md:text-5xl font-light text-white 
                  placeholder:text-white/30 
                  focus-visible:ring-0 focus-visible:border-white
                  focus-visible:outline-none 
                  h-auto py-4 
                  transition-all duration-300
                  shadow-none
                  font-crimson
                "
                placeholder="Type your name here..."
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !needsAlias) {
                    e.preventDefault();
                    onNext();
                  }
                }}
              />
            </FormControl>
            <FormMessage className="text-[#e54d2e] text-2xl" />
          </FormItem>
        )}
      />

      <div
        className={`w-full transition-all duration-500 overflow-hidden ${needsAlias ? "max-h-96 pb-6 opacity-100 mt-12" : "max-h-0 opacity-0 mt-0"}`}
      >
        <FormField
          control={form.control}
          name="alias"
          render={({ field }) => (
            <FormItem className="w-full space-y-4">
              <FormLabel className="text-xl md:text-2xl font-pirate font-bold text-white/80 drop-shadow-sm leading-tight tracking-wide flex flex-col items-center text-center">
                <span>Short Name for ID Card</span>
                <span className="text-sm font-crimson text-white/60 mt-2 max-w-sm">
                  Enter your nickname or short name to be printed on the ID Card
                </span>
                <span
                  className={`text-lg font-crimson mt-2 ${needsAlias ? "text-[#e54d2e]" : "text-white/50"}`}
                >
                  {needsAlias
                    ? "(Required - Must be 15 chars or less)"
                    : "(Optional - Must be 15 chars or less)"}
                </span>
              </FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, "");
                    field.onChange(val);
                  }}
                  className="
                    block w-full max-w-md mx-auto
                    bg-white/10 backdrop-blur-sm
                    border-2 border-white/20 
                    rounded-xl 
                    text-center font-light text-white 
                    placeholder:text-white/30 
                    focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:border-white/50
                    focus-visible:outline-none 
                    h-auto py-3 
                    transition-all duration-300
                    shadow-md
                    font-crimson
                    text-3xl!
                  "
                  placeholder="Short Name"
                  autoComplete="off"
                  maxLength={15}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onNext();
                    }
                  }}
                />
              </FormControl>

              <FormMessage className="text-[#e54d2e] text-xl text-center" />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center font-pirate text-xl justify-center gap-2 text-white/80 mt-12 animate-pulse">
        <span>
          Press <span className="font-bold text-white">Enter ↵</span>
        </span>
      </div>
    </div>
  );
}
