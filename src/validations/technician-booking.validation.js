import { z } from "zod";

const positiveIntSchema = z
  .number({ message: "Value must be a number" })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const technicianBookingStatusSchema = z.enum(
  ["pending", "confirmed", "technician_confirmed", "rejected", "cancelled"],
  {
    message: "Invalid booking status",
  },
);

const optionalStringSchema = (max, message) =>
  z.string().trim().max(max, message).optional();

export const technicianBookingQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: technicianBookingStatusSchema.optional(),

  page: z.coerce
    .number({
      message: "Page must be a number",
    })
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),

  per_page: z.coerce
    .number({
      message: "Per page must be a number",
    })
    .int("Per page must be an integer")
    .positive("Per page must be greater than 0")
    .max(100, "Per page must not exceed 100")
    .default(20),
});

export const technicianBookingIdSchema = z.object({
  id: positiveIntSchema,
});

export const technicianConfirmBookingSchema = z.object({
  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),
});

export const technicianRejectBookingSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(5000, "Rejection reason must not exceed 5000 characters"),
});
