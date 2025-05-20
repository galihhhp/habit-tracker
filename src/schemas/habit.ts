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
    .min(1, "End date is required"),
  frequency: z.object({
    times: z.number()
      .min(1, "Frequency must be at least 1")
      .max(7, "Frequency must be at most 7"),
    period: z.literal("week")
  })
})

export type HabitFormData = z.infer<typeof habitSchema> 