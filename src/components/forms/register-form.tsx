"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import { toast } from "sonner";
import { CollegeStep } from "~/components/forms/register-steps/CollegeStep";
import { CourseStep } from "~/components/forms/register-steps/CourseStep";
import { GenderStep } from "~/components/forms/register-steps/GenderStep";
import { GithubStep } from "~/components/forms/register-steps/GithubStep";
import { IdProofStep } from "~/components/forms/register-steps/IdProofStep";
import { NameStep } from "~/components/forms/register-steps/NameStep";
import { PhoneStep } from "~/components/forms/register-steps/PhoneStep";
import { StateStep } from "~/components/forms/register-steps/StateStep";
import { useDayNight } from "~/components/providers/useDayNight";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { apiFetch } from "~/lib/fetcher";
import {
  type RegisterParticipantInput,
  registerParticipantSchema,
} from "~/lib/validation/participant";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

interface RegisterFormProps {
  initialGithubUsername?: string;
}

type FormValues = RegisterParticipantInput;

export function RegisterForm({ initialGithubUsername }: RegisterFormProps) {
  const router = useRouter();
  const { isNight } = useDayNight();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (step > furthestStep) {
      setFurthestStep(step);
    }
  }, [step, furthestStep]);

  const form = useForm<FormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: Resolving zod types is complex
    resolver: zodResolver(registerParticipantSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      state: undefined,
      course: undefined,
      gender: undefined,
      collegeId: "",
      github: initialGithubUsername ?? undefined,
      idProof: undefined,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("hackfest_register_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step !== undefined) setStep(parsed.step);
        if (parsed.furthestStep !== undefined)
          setFurthestStep(parsed.furthestStep);
        if (parsed.formData) {
          form.reset({
            ...parsed.formData,
            github: initialGithubUsername || undefined,
          });
        }
      } catch (e) {
        console.error("Failed to parse saved registration progress", e);
      }
    }
    setIsLoaded(true);
  }, [form, initialGithubUsername]);

  const formValues = form.watch();
  useEffect(() => {
    if (isLoaded) {
      // biome-ignore lint/correctness/noUnusedVariables: strip github from localStorage
      const { github, ...formDataToSave } = formValues;
      const dataToSave = {
        step,
        furthestStep,
        formData: formDataToSave,
      };
      localStorage.setItem(
        "hackfest_register_progress",
        JSON.stringify(dataToSave),
      );
    }
  }, [isLoaded, step, furthestStep, formValues]);

  const steps = [
    "name",
    "phone",
    "state",
    "course",
    "gender",
    "collegeId",
    "github",
    "idProof",
  ] as const;

  const stepConfig = [
    { id: "name", label: "Personal Details" },
    { id: "phone", label: "Contact Number" },
    { id: "state", label: "State/Province" },
    { id: "course", label: "Graduation Course" },
    { id: "gender", label: "Gender" },
    { id: "collegeId", label: "College" },
    { id: "github", label: "GitHub Alias" },
    { id: "idProof", label: "Identity Proof" },
  ] as const;

  const currentField = steps[step];
  const isLastStep = step === steps.length - 1;

  // Calculate progress percentage
  const progressPercentage = ((step + 1) / steps.length) * 100;

  async function handleNext(): Promise<void> {
    const fieldsToTrigger =
      currentField === "name" ? (["name", "alias"] as const) : currentField;
    const valid = await form.trigger(fieldsToTrigger);
    if (!valid) return;
    if (!isLastStep) setStep((s) => s + 1);
  }

  function handleBack(): void {
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleTimelineClick(index: number) {
    if (index === step) return;

    if (index < step) {
      setStep(index);
    } else {
      if (index <= furthestStep) {
        const fieldsToTrigger =
          currentField === "name" ? (["name", "alias"] as const) : currentField;
        const valid = await form.trigger(fieldsToTrigger);
        if (valid) {
          setStep(index);
        }
      }
    }
  }

  useEffect(() => {
    async function loadColleges(): Promise<void> {
      try {
        const result = await apiFetch<{ colleges: College[] }>(
          "/api/colleges/list",
        );
        setColleges(result?.colleges ?? []);
      } finally {
        setLoadingColleges(false);
      }
    }
    loadColleges();
  }, []);

  async function onSubmit(data: RegisterParticipantInput): Promise<void> {
    if (
      data.name.trim().length > 15 &&
      (!data.alias || data.alias.length > 15)
    ) {
      form.setError("alias", {
        type: "manual",
        message: "Alias is required as your name is longer than 15 characters",
      });
      return;
    }
    if (data.alias && data.alias.trim().length > 15) {
      form.setError("alias", {
        type: "manual",
        message: "Alias must be 15 characters or less",
      });
      return;
    }
    if (data.name.trim().length < 15) {
      data.alias = "";
    }
    if (data.alias?.trim() === "") {
      form.setValue("alias", data.name.trim());
    }
    await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        name: data.name.trim(),
        alias: data.alias?.trim() || undefined,
        phone: data.phone.trim(),
        github: data.github?.trim() || undefined,
      }),
    });

    localStorage.removeItem("hackfest_register_progress");
    window.scrollTo(0, 0);
    router.push("/teams");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isLastStep) {
            e.preventDefault();
          }
        }}
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("Validation errors:", errors);
        })}
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 overflow-hidden text-white"
      >
        {/* --- TOP PROGRESS BAR --- */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20 z-50">
          <div
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-700 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <Image
            src={
              isNight
                ? "/images/shipwreck/shipwreckNight.webp"
                : "/images/shipwreck/shipwreckDay.webp"
            }
            alt="Shipwreck background"
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>

        <div className="lg:hidden absolute top-8 left-6 text-sm text-white/80 z-20 font-medium tracking-wide">
          STEP {step + 1} OF {steps.length}
        </div>

        <div className="hidden lg:flex absolute left-6 xl:left-24 top-0 bottom-0 flex-col justify-center z-20 w-64 pointer-events-auto">
          <div className="relative pl-6 border-l-[1.5px] border-white/20 space-y-6">
            {stepConfig.map((s, i) => {
              const isPast = i < step;
              const isCurrent = i === step;
              const isAvailable = i <= furthestStep;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleTimelineClick(i)}
                  disabled={!isAvailable}
                  className={`
                    group relative flex items-center text-left w-full transition-all duration-300
                    ${isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-40"}
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 rounded-lg
                  `}
                >
                  <div
                    className={`
                      absolute -left-[33px] w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                      ${
                        isCurrent
                          ? "bg-white border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                          : isPast
                            ? "bg-white/90 border-white/90"
                            : "bg-black/40 border-white/30 group-hover:bg-white/20"
                      }
                    `}
                  >
                    {isPast && <Check className="w-3.5 h-3.5 text-[#10569c]" />}
                  </div>
                  <span
                    className={`
                      ml-2 transition-all duration-300 font-medium
                      ${
                        isCurrent
                          ? "text-white text-lg tracking-widest font-pirate translate-x-2"
                          : isPast
                            ? "text-white/80 text-sm tracking-widest font-pirate"
                            : "text-white/60 text-sm tracking-widest font-pirate group-hover:text-white/70"
                      }
                    `}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div
          key={step}
          className="relative z-10 w-full max-w-xl space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* NAME */}
          {currentField === "name" && (
            <NameStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* PHONE */}
          {currentField === "phone" && (
            <PhoneStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* STATE */}
          {currentField === "state" && (
            <StateStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* COURSE */}
          {currentField === "course" && (
            <CourseStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* GENDER */}
          {currentField === "gender" && (
            <GenderStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* COLLEGE */}
          {currentField === "collegeId" && (
            <CollegeStep
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              colleges={colleges}
              loadingColleges={loadingColleges}
            />
          )}

          {/* GITHUB */}
          {currentField === "github" && (
            <GithubStep
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              initialGithubUsername={initialGithubUsername}
            />
          )}

          {/* ID PROOF */}
          {currentField === "idProof" && (
            <IdProofStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* Navigation Buttons */}
          <div className="flex w-full items-center gap-3 pt-6">
            {/* BACK BUTTON OR SPACER */}
            {step > 0 ? (
              <Button
                type="button"
                onClick={handleBack}
                className="
                gap-4
                  flex-1 h-12 rounded-xl text-lg font-pirate font-bold shadow-sm transition-all tracking-wide
                  bg-white text-[#10569c] hover:bg-white/70 hover:scale-[1.01] active:scale-[0.99] backdrop-blur-md
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
                "
              >
                <ArrowLeft className="w-5 h-5" />{" "}
                <span className="mr-16">Back</span>
              </Button>
            ) : (
              <div className="flex-1" />
            )}

            {/* CONTINUE / SUBMIT BUTTON */}
            <Button
              type={isLastStep ? "submit" : "button"}
              onClick={!isLastStep ? handleNext : undefined}
              disabled={form.formState.isSubmitting}
              className="
                gap-4
                flex-1 h-12 rounded-xl text-lg font-pirate font-bold shadow-lg transition-all tracking-wide
                bg-white text-[#10569c] hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-70 disabled:pointer-events-none cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
              "
            >
              {form.formState.isSubmitting ? (
                "Submitting..."
              ) : isLastStep ? (
                <>
                  <span className="ml-16">Submit</span>{" "}
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span className="ml-16">Next</span>{" "}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
