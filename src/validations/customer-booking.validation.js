import { z } from "zod";

const positiveIntSchema = z
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const requiredStringSchema = (max, message) =>
  z.string().trim().min(1, "This field is required").max(max, message);

const optionalStringSchema = (max, message) =>
  z.string().trim().max(max, message).optional().nullable();

const dateTimeSchema = z
  .string()
  .trim()
  .min(1, "Scheduled date and time is required")
  .refine(
    (value) => {
      const date = new Date(value);

      return !Number.isNaN(date.getTime());
    },
    {
      message: "Scheduled date and time must be a valid date",
    },
  );

export const serviceBookingQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: z
    .enum([
      "pending",
      "confirmed",
      "technician_confirmed",
      "rejected",
      "cancelled",
    ])
    .optional(),

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

export const serviceBookingIdSchema = z.object({
  id: positiveIntSchema,
});

export const createCustomerBookingSchema = z.object({
  vehicle_id: positiveIntSchema,

  complaint: requiredStringSchema(
    5000,
    "Complaint must not exceed 5000 characters",
  ),

  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),

  scheduled_at: dateTimeSchema,
});

export const cancelCustomerBookingSchema = z.object({
  notes: requiredStringSchema(
    5000,
    "Cancellation reason must not exceed 5000 characters",
  ),
});
