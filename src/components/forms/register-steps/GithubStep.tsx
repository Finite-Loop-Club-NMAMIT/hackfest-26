"use client";

import { Github, RepeatIcon } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface GithubStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
  initialGithubUsername?: string;
}

export function GithubStep({ form, initialGithubUsername }: GithubStepProps) {
  return (
    <div className="w-full flex flex-col items-center font-pirate animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="github"
        render={({ field }) => (
          <FormItem className="w-full space-y-8 text-center">
            {/* Icon Decoration */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
                <Github className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight block tracking-wide">
                GitHub Username
              </FormLabel>
              <p className="text-white/80 text-pirate text-lg">
                This account is linked to your registration
              </p>
            </div>

            <FormControl>
              <div className="relative w-full max-w-lg mx-auto">
                {/* Custom Div replacing the Input field */}
                <div
                  title={field.value ?? initialGithubUsername ?? ""}
                  className="
                    w-full
                    h-16
                    flex items-center justify-center
                    rounded-xl
                    border border-white/20
                    bg-white
                    shadow-sm

                    px-4
                    text-xl font-pirate font-medium font-mono text-[#10569c]
                    cursor-default
                  "
                >
                  {field.value ?? initialGithubUsername ?? ""}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut({ redirect: false });
                    await signIn("github");
                  }}
                  className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-4 border-l-2 border-slate-200 hover:bg-black/5 cursor-pointer rounded-r-xl transition-colors group"
                  title="Switch GitHub Account"
                >
                  <RepeatIcon className="h-5 w-5 text-[#10569c] group-hover:text-[#0c4075] transition-colors" />
                </button>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
