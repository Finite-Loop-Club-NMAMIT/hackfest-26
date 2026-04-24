import { z } from "zod";
import { teamCommitteeEnum } from "~/db/enum";

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const optionalEmail = z
  .string()
  .trim()
  .email("Must be a valid email")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const teamMemberSocialLinksSchema = z.object({
  linkedin: optionalUrl,
  github: optionalUrl,
  twitter: optionalUrl,
  instagram: optionalUrl,
  email: optionalEmail,
});

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().trim().min(1, "Role is required"),
  committee: z.enum(teamCommitteeEnum.enumValues),
  photo: optionalUrl,
  cloudinaryId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  socialLinks: teamMemberSocialLinksSchema.optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTeamMemberSchema = teamMemberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
