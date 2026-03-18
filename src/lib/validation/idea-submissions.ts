import z from "zod";

export const createRoundSchema = z.object({
  name: z.string().min(1, "Round name is required").max(100),
  roleId: z.string().min(1, "Role is required"),
  targetStage: z.enum(["NOT_SELECTED", "SEMI_SELECTED", "SELECTED"]),
});

export const updateRoundStatusSchema = z.object({
  id: z.string().min(1, "Round ID is required"),
  status: z.enum(["Draft", "Active", "Completed"]),
});
