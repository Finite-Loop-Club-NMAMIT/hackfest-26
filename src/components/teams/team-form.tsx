"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarDays, Download, FileText, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { apiFetch } from "~/lib/fetcher";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

const joinTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

type CreateTeamInput = z.infer<typeof createTeamSchema>;
type JoinTeamInput = z.infer<typeof joinTeamSchema>;

export function TeamForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);

  const createForm = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
  });

  const joinForm = useForm<JoinTeamInput>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: {
      teamId: "",
    },
  });

  async function onCreateTeam(data: CreateTeamInput) {
    const teamName = data.name.trim();
    if (!teamName) return;

    setLoading(true);
    setSuggestedNames([]);

    try {
      try {
        const checkRes = await fetch(
          process.env.NEXT_PUBLIC_TEAM_NAME_CHECK_API_URL || "",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamName }),
          },
        );

        if (checkRes.status === 405) {
          const checkData2 = await checkRes.json();
          const checkData = checkData2[0].output;
          if (
            checkData.suggested_names &&
            checkData.suggested_names.length > 0
          ) {
            setSuggestedNames(checkData.suggested_names);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Team name validation API failed:", err);
      }

      const result = await apiFetch<{ team: { id: string } }>(
        "/api/teams/create",
        {
          method: "POST",
          body: JSON.stringify({ name: teamName }),
        },
      );

      createForm.reset();
      if (result?.team?.id) {
        router.push(`/teams/${result.team.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function onJoinTeam(data: JoinTeamInput) {
    setLoading(true);
    try {
      const result = await apiFetch<{ team: { id: string } }>(
        "/api/teams/join",
        {
          method: "POST",
          body: JSON.stringify({ teamId: data.teamId.trim() }),
        },
      );

      if (result?.team?.id) {
        router.push(`/teams/${result.team.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 w-full mt-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/20 bg-linear-to-br from-[#10569c] to-[#0a3d6e] p-5 shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-white/10 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 bg-white/10 rounded-xl ring-1 ring-white/20 shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-pirate font-bold text-white tracking-wide drop-shadow-md">
              Team Size
            </h3>
          </div>
          <p className="text-white/90 text-sm md:text-base font-semibold font-crimson leading-relaxed relative z-10">
            Each team can have a maximum of <span className="font-bold text-white text-base md:text-lg bg-white/20 px-1.5 py-0.5 rounded-md mx-0.5">3 to 4</span> members.
          </p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-linear-to-br from-[#10569c] to-[#0a3d6e] p-5 shadow-xl transition-all flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-white/10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded-xl ring-1 ring-white/20 shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-pirate font-bold text-white tracking-wide drop-shadow-md">
                PPT Template
              </h3>
            </div>
            <p className="text-white/90 text-sm md:text-base font-semibold font-crimson mb-4 leading-relaxed">
              Download the official template to prepare your idea submission.
            </p>
          </div>
          <a
            href="/pptTemplate/Hackfest26-ppt-template.pptx"
            download
            className="mt-auto relative z-10 flex items-center justify-center gap-2 bg-white text-[#10569c] px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] text-sm tracking-wide"
          >
            <Download className="h-4 w-4" />
            Download Template
          </a>
        </div>

        <div className="rounded-2xl border border-white/20 bg-linear-to-br from-[#0a3d6e] to-[#10569c] p-5 shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-white/10 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 bg-white/10 rounded-xl ring-1 ring-white/20 shadow-sm">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-pirate font-bold text-white tracking-wide drop-shadow-md">
              Shortlisting
            </h3>
          </div>
          <p className="text-white/90 text-sm md:text-base font-semibold font-crimson leading-relaxed relative z-10">
            Based on your PPT and idea, we will judge and shortlist <span className="font-bold text-white text-base md:text-lg bg-white/20 px-1.5 py-0.5 rounded-md mx-0.5">60 teams</span>. Registration ends on <span className="font-bold text-white text-base md:text-lg bg-white/20 px-1.5 py-0.5 rounded-md mx-0.5">15th March</span>.
          </p>
        </div>
      </div>

      {/* --- CREATE TEAM CARD --- */}
      <div className="w-full rounded-2xl border border-white/50 bg-white/90 backdrop-blur-md p-5 shadow-xl transition-all">
        <div className="mb-4 space-y-1">
          <div className="flex items-center gap-3">
            {/* Flipped icon colors */}
            <div className="p-1.5 bg-[#10569c]/10 rounded-xl ring-1 ring-[#10569c]/20 shadow-sm">
              <Users className="w-5 h-5 text-[#10569c]" />
            </div>
            <h2 className="text-2xl font-pirate font-bold text-[#10569c] tracking-wide drop-shadow-sm">
              Create Team
            </h2>
          </div>
          <p className="text-[#10569c]/70 text-sm md:text-base font-medium">
            Create a new team and become the team leader.
          </p>
        </div>

        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(onCreateTeam)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-pirate text-[#10569c] tracking-wide">
                    Team Name
                  </FormLabel>
                  <FormControl>
                    {/* Pure white input to pop off the white/90 background */}
                    <Input
                      placeholder="e.g. The Black Pearl"
                      {...field}
                      className="
                        w-full h-12 rounded-xl border border-[#10569c]/20 bg-white px-4 
                        text-lg font-medium font-pirate text-[#10569c] 
                        placeholder:text-[#10569c]/40 leading-none shadow-sm
                        focus-visible:ring-2 focus-visible:ring-[#10569c]/40 focus-visible:border-[#10569c]/40
                        transition-all duration-200
                      "
                    />
                  </FormControl>
                  <FormMessage className="text-[#e54d2e] text-lg font-crimson" />
                  {suggestedNames.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm md:text-base font-crimson font-medium text-[#e54d2e] mb-2 tracking-wide">
                        That name is not allowed. Try one of these:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedNames.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              createForm.setValue("name", name);
                              setSuggestedNames([]);
                            }}
                            className="text-sm font-crimson font-semibold px-3 py-1.5 rounded-xl bg-[#10569c]/10 text-[#10569c] border border-[#10569c]/30 hover:bg-[#10569c]/20 hover:border-[#10569c]/50 transition-all shadow-sm active:scale-95"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
            {/* Flipped button colors */}
            <Button
              type="submit"
              disabled={loading || createForm.formState.isSubmitting}
              className="
                w-full h-12 rounded-xl text-lg font-pirate font-bold shadow-md transition-all tracking-wide
                bg-[#10569c] text-white hover:bg-[#10569c]/90 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center
              "
            >
              {createForm.formState.isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  Create Team <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Separator / OR (Left untouched as it sits on the main background) */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-white/30"></div>
        <span className="flex-shrink-0 mx-4 text-white/90 font-pirate font-bold text-xl tracking-widest drop-shadow-sm">
          OR
        </span>
        <div className="flex-grow border-t border-white/30"></div>
      </div>

      {/* --- JOIN TEAM CARD --- */}
      <div className="w-full rounded-2xl border border-white/50 bg-white/90 backdrop-blur-md p-5 shadow-xl transition-all">
        <div className="mb-4 space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#10569c]/10 rounded-xl ring-1 ring-[#10569c]/20 shadow-sm">
              <UserPlus className="w-5 h-5 text-[#10569c]" />
            </div>
            <h2 className="text-2xl font-pirate font-bold text-[#10569c] tracking-wide drop-shadow-sm">
              Join Team
            </h2>
          </div>
          <p className="text-[#10569c]/70 text-sm md:text-base font-medium">
            Enter the Team ID shared by the team leader.
          </p>
        </div>

        <Form {...joinForm}>
          <form
            onSubmit={joinForm.handleSubmit(onJoinTeam)}
            className="space-y-4"
          >
            <FormField
              control={joinForm.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-pirate text-[#10569c] tracking-wide">
                    Team ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 1234-5678"
                      {...field}
                      className="
                        w-full h-12 rounded-xl border border-[#10569c]/20 bg-white px-4 
                        text-lg font-medium font-pirate text-[#10569c] 
                        placeholder:text-[#10569c]/40 leading-none shadow-sm
                        focus-visible:ring-2 focus-visible:ring-[#10569c]/40 focus-visible:border-[#10569c]/40
                        transition-all duration-200
                      "
                    />
                  </FormControl>
                  <FormMessage className="text-[#e54d2e] text-lg font-pirate" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading || joinForm.formState.isSubmitting}
              className="
                w-full h-12 rounded-xl text-lg font-pirate font-bold shadow-md transition-all tracking-wide
                bg-[#10569c] text-white hover:bg-[#10569c]/90 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center
              "
            >
              {joinForm.formState.isSubmitting ? "Joining..." : "Join Team"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
