"use client";

import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import { CloudinaryUpload } from "~/components/cloudinary-upload";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import type { RegisterParticipantInput } from "~/lib/validation/participant";

interface IdProofStepProps {
  form: UseFormReturn<RegisterParticipantInput>;
  onNext: () => void;
  onBack?: () => void;
}

export function IdProofStep({ form, onNext }: IdProofStepProps) {
  return (
    // Removed accidental `font-pirate` from this root div so it doesn't mess with normal text
    <div className="w-full flex flex-col items-center font-pirate animate-in fade-in slide-in-from-bottom-8 duration-700">
      <FormField
        control={form.control}
        name="idProof"
        render={({ field }) => (
          // Changed max-w-2xl to max-w-lg to match State and Github steps perfectly, and added flex column centering
          <FormItem className="w-full max-w-lg space-y-8 flex flex-col items-center">
            {/* Header Section strictly centered */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
              {/* Added `block` to ensure the label takes up the full width for proper text-centering */}
              <FormLabel className="text-3xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm leading-tight block tracking-wide">
                Upload your ID Proof
              </FormLabel>
              <p className="text-white/60 text-lg">
                College ID or Government ID (Max 1MB)
              </p>
            </div>

            <FormControl>
              <div className="relative w-full">
                {field.value ? (
                  /* IMAGE PREVIEW */
                  <div className="relative group w-full rounded-xl border border-white/10 bg-white/90 overflow-hidden shadow-lg transition-all duration-200">
                    <div className="relative group w-full rounded-xl border border-white/10 bg-white/90 overflow-hidden shadow-lg transition-all duration-200">
                      <Image
                        src={field.value}
                        alt="ID Proof"
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => field.onChange(undefined)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest bg-white border border-white/20 text-[#10569c] hover:bg-white/80 transition shadow-sm"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UPLOAD CARD */
                  <div className="w-full">
                    <div
                      className="
                        group
                        flex flex-col items-center justify-center
                        w-full h-64          {/* <-- Changed from h-40 to h-64 */}
                        rounded-xl
                        border border-white/10
                        bg-white/90
                        transition-all duration-200
                        hover:bg-white/80 hover:border-white/30
                        shadow-sm
                      "
                    >
                      <UploadCloud className="w-8 h-8 text-[#10569c]/60 mb-2" />

                      <p className="text-lg font-medium font-pirate text-[#10569c]">
                        Upload ID Proof
                      </p>

                      <p className="text-sm text-[#10569c]/60">
                        JPG, PNG • Max 1MB
                      </p>

                      <div className="mt-4">
                        <CloudinaryUpload
                          onUpload={(url) => {
                            field.onChange(url);
                            onNext();
                          }}
                          allowedFormats={["png", "jpg", "jpeg"]}
                          maxFileSize={1024 * 1024}
                          label="Select File"
                          folder="idProof"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormControl>

            <FormMessage className="text-[#e54d2e] text-2xl" />
          </FormItem>
        )}
      />
    </div>
  );
}
