"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UpdateSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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

  console.log("Form data:", form.watch());

  useEffect(() => {
    async function loadColleges() {
      try {
        const result = await apiFetch<{ colleges: College[] }>(
          "/api/colleges/events/list",
        );
        setColleges(result?.colleges ?? []);
      } catch (_err) {
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
    } catch (_err) {
      console.error("Error updating user details:", _err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genderEnum.enumValues.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* State */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>State</FormLabel>
                  <Combobox
                    items={stateEnum.enumValues}
                    onValueChange={field.onChange}
                  >
                    <ComboboxInput
                      placeholder="Select state"
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No state found.</ComboboxEmpty>
                      <ComboboxList>
                        {(state) => (
                          <ComboboxItem
                            key={state}
                            value={state}
                            onSelect={() => field.onChange(state)}
                          >
                            {state}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* College */}
            <FormField
              control={form.control}
              name="collegeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>College</FormLabel>
                  <Combobox
                    disabled={
                      form.watch("state") == null ||
                      form.watch("state") === undefined
                    }
                    items={colleges.filter(
                      (college) => college.state === form.watch("state"),
                    )}
                    itemToStringLabel={(college: (typeof colleges)[number]) =>
                      college.name ?? "Unknown College"
                    }
                    onValueChange={(value) => field.onChange(value?.id)}
                  >
                    <ComboboxInput
                      disabled={
                        form.watch("state") == null ||
                        form.watch("state") === undefined
                      }
                      placeholder={
                        loadingColleges
                          ? "Loading colleges..."
                          : "Select college"
                      }
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No college found.</ComboboxEmpty>
                      <ComboboxList>
                        {(college) => (
                          <ComboboxItem
                            key={college.name}
                            value={college}
                            onSelect={() => field.onChange(college.id)}
                          >
                            {college.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  Submitting
                  <LoaderCircle className="animate-spin" />
                </div>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
