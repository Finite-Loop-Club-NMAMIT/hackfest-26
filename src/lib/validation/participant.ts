import { z } from "zod";
import { courseEnum, genderEnum, stateEnum } from "~/db/enum";

export const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  alias: z.string().nullable(),
  email: z.string(),
  emailVerified: z.date().nullable(),
  image: z.string(),
  phone: z.string().nullable(),
  state: z.enum(stateEnum.enumValues).nullable(),
  course: z.enum(courseEnum.enumValues).nullable(),
  gender: z.enum(genderEnum.enumValues).nullable(),
  attended: z.boolean().default(false),
  isRegistrationComplete: z.boolean().default(false),
  idProof: z.string().nullable(),
  resume: z.string().nullable(),
  github: z.string().nullable(),
  collegeId: z.string().nullable(),
  teamId: z.string().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const registerParticipantSchema = z
  .object({
    name: z.string().min(3, "Name must be greater than 3 characters"),
    alias: z.string().max(15, "Alias must be 15 characters or less").optional(),
    phone: z
      .string()
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits")
      .regex(/^[0-9]+$/, "Phone number must contain only digits"),
    state: z.enum(stateEnum.enumValues, {
      message: "Please select a valid state",
    }),
    course: z.enum(courseEnum.enumValues, {
      message: "Please select a valid course",
    }),
    gender: z.enum(genderEnum.enumValues, {
      message: "Please select a valid gender",
    }),
    collegeId: z.string().min(1, "College is required"),
    github: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.string().min(1, "GitHub username is required").optional(),
    ),
    idProof: z.url({ message: "ID Proof must be a valid URL" }),
  })
  .superRefine((val, ctx) => {
    if (val.name.length > 15 && (!val.alias || val.alias.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Alias is required when name exceeds 15 characters",
        path: ["alias"],
      });
    }
  });

export const updateParticipantSchema = participantSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
  })
  .partial();

export type RegisterParticipantInput = z.infer<
  typeof registerParticipantSchema
>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
