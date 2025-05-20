import { z } from "zod"

export const habitSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .max(250, "Description must be less than 250 characters")
    .nullable()
    .optional()
    .transform(val => val || ""),
  startDate: z.string()
    .min(1, "Start date is required"),
  endDate: z.string()
    .min(1, "End date is required")
})

export type HabitFormData = z.infer<typeof habitSchema> 