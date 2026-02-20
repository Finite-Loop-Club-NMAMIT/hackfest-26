"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UpdateSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { genderEnum, stateEnum } from "~/db/enum";
import { apiFetch } from "~/lib/fetcher";
import {
  type UpdateEventUserInput,
  updateEventUserSchema,
} from "~/lib/validation/event";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

type FormValues = UpdateEventUserInput;

export function UserDetailsForm({
  sessionUpdate,
}: {
  sessionUpdate: UpdateSession;
}) {
  const router = useRouter();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateEventUserSchema),
    defaultValues: {
      state: undefined,
      gender: undefined,
      collegeId: "",
    },
  });

  const selectedState = form.watch("state");

  useEffect(() => {
    form.setValue("collegeId", "");
  }, [form]);

  useEffect(() => {
    async function loadColleges() {
      try {
        const result = await apiFetch<{ colleges: College[] }>(
          "/api/colleges/list",
        );
        setColleges(result?.colleges ?? []);
      } catch {
        toast.error("Failed to load colleges");
      } finally {
        setLoadingColleges(false);
      }
    }
    loadColleges();
  }, []);

  async function onSubmit(data: UpdateEventUserInput) {
    try {
      setSubmitting(true);
      await apiFetch("/api/events/users/update", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await sessionUpdate();
      router.refresh();
    } catch {
      toast.error("Failed to update details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredColleges = colleges.filter(
    (college) => college.state === selectedState,
  );

  const stateNotSelected = !selectedState;

  return (
    <Dialog open={true}>
      <DialogContent className="bg-[#0f1823] border border-[#39577c] text-white p-0 overflow-hidden max-w-md w-full rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Complete Your Registration Details</DialogTitle>
        </VisuallyHidden>
        {/* Header strip — matches TeamRegistrationDialog */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[#39577c]/50">
          <span className="text-sm font-semibold tracking-widest uppercase text-[#f4d35e]/60">
            Complete Registration
          </span>
        </div>

        <div className="px-5 py-6">
          <p className="text-white/50 text-sm mb-5">
            We need a few more details before you can register for events.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                      Gender
                    </FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-[#133c55]/50 border-[#39577c] text-white focus:ring-[#f4d35e]/40 data-placeholder:text-white/30">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0f1823] border-[#39577c] text-white">
                        {genderEnum.enumValues.map((gender) => (
                          <SelectItem
                            key={gender}
                            value={gender}
                            className="focus:bg-[#133c55] focus:text-white"
                          >
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              {/* State */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                      State
                    </FormLabel>
                    <Combobox
                      items={stateEnum.enumValues}
                      onValueChange={field.onChange}
                    >
                      <ComboboxInput
                        placeholder="Select state"
                        className="w-full bg-[#133c55]/50 border-[#39577c] text-white placeholder:text-white/30 focus-visible:ring-[#f4d35e]/40"
                      />
                      <ComboboxContent className="bg-[#0f1823] border-[#39577c]">
                        <ComboboxEmpty className="text-white/40">
                          No state found.
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(state) => (
                            <ComboboxItem
                              key={state}
                              value={state}
                              onSelect={() => field.onChange(state)}
                              className="text-white focus:bg-[#133c55]"
                            >
                              {state}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              {/* College */}
              <FormField
                control={form.control}
                name="collegeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                      College
                    </FormLabel>
                    <Combobox
                      key={selectedState}
                      disabled={stateNotSelected}
                      items={filteredColleges}
                      itemToStringLabel={(college: College) =>
                        college.name ?? "Unknown College"
                      }
                      onValueChange={(value) => field.onChange(value?.id)}
                    >
                      <ComboboxInput
                        disabled={stateNotSelected}
                        placeholder={
                          loadingColleges
                            ? "Loading colleges..."
                            : stateNotSelected
                              ? "Select a state first"
                              : "Select college"
                        }
                        className="w-full bg-[#133c55]/50 border-[#39577c] text-white placeholder:text-white/30 focus-visible:ring-[#f4d35e]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <ComboboxContent className="bg-[#0f1823] border-[#39577c]">
                        <ComboboxEmpty className="text-white/40">
                          No college found.
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(college) => (
                            <ComboboxItem
                              key={college.name}
                              value={college}
                              onSelect={() => field.onChange(college.id)}
                              className="text-white focus:bg-[#133c55]"
                            >
                              {college.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full py-5 bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all duration-200 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    Submitting
                    <LoaderCircle className="animate-spin" size={16} />
                  </span>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
