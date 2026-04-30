import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().url().safeParse(value).success,
    "Must be a valid URL or empty",
  )
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Must be a valid email or empty",
  )
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const facultySocialLinksSchema = z
  .object({
    linkedin: optionalUrl,
    github: optionalUrl,
    twitter: optionalUrl,
    instagram: optionalUrl,
    email: optionalEmail,
  })
  .optional();

export const facultySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  designation: z.string().trim().min(1, "Designation is required"),
  department: z.string().trim().min(1, "Department is required"),
  photo: optionalUrl,
  cloudinaryId: z
    .union([z.literal(""), z.string().trim()])
    .optional()
    .transform((value) => (value && value !== "" ? value : undefined)),
  socialLinks: facultySocialLinksSchema.optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createFacultySchema = facultySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFacultySchema = createFacultySchema.partial();

export type FacultyInput = z.infer<typeof facultySchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
