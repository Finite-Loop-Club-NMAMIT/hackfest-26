import z from "zod";
import { genderEnum, stateEnum } from "~/db/enum";

export const eventSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10),
  date: z.date().optional(),
  venue: z.string().min(2).max(100),
  deadline: z.date().optional(),
  image: z.string(),
  type: z.enum(["Solo", "Team"]),
  status: z.enum(["Draft", "Published", "Ongoing", "Completed"]),
  maxTeams: z.number().min(0),
  minTeamSize: z.number().min(1),
  maxTeamSize: z.number().min(1),
});

export const updateEventUserSchema = z.object({
  state: z.enum(stateEnum.enumValues, {
    message: "Please select a valid state",
  }),
  gender: z.enum(genderEnum.enumValues, {
    message: "Please select a valid gender",
  }),
  collegeId: z.string().min(1, "College is required"),
});

export type UpdateEventUserInput = z.infer<typeof updateEventUserSchema>;
