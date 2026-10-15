import { z } from "zod";

const positiveIntSchema = z.coerce
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const bookingStatusSchema = z.enum(
  ["pending", "confirmed", "technician_confirmed", "rejected", "cancelled"],
  {
    message: "Invalid booking status",
  },
);

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

const yearSchema = z.coerce
  .number({
    message: "Year must be a number",
  })
  .int("Year must be an integer")
  .min(1900, "Year must be greater than or equal to 1900")
  .max(new Date().getFullYear() + 1, "Year must not be in the distant future")
  .optional()
  .nullable();

const registeredBookingFields = {
  customer_id: positiveIntSchema,

  vehicle_id: positiveIntSchema,

  complaint: requiredStringSchema(
    5000,
    "Complaint must not exceed 5000 characters",
  ),

  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),

  scheduled_at: dateTimeSchema,
};

const guestBookingFields = {
  customer_name: requiredStringSchema(
    100,
    "Customer name must not exceed 100 characters",
  ),

  customer_phone: requiredStringSchema(
    30,
    "Customer phone must not exceed 30 characters",
  ),

  plate_number: requiredStringSchema(
    20,
    "Plate number must not exceed 20 characters",
  ),

  brand: requiredStringSchema(
    100,
    "Vehicle brand must not exceed 100 characters",
  ),

  model: requiredStringSchema(
    100,
    "Vehicle model must not exceed 100 characters",
  ),

  year: yearSchema,

  color: optionalStringSchema(
    50,
    "Vehicle color must not exceed 50 characters",
  ),

  complaint: requiredStringSchema(
    5000,
    "Complaint must not exceed 5000 characters",
  ),

  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),

  scheduled_at: dateTimeSchema,
};

export const adminBookingQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: bookingStatusSchema.optional(),

  customer_type: z
    .enum(["registered", "guest"], {
      message: "Customer type must be registered or guest",
    })
    .optional(),

  technician_id: positiveIntSchema.optional(),

  date_from: z.string().trim().optional(),

  date_to: z.string().trim().optional(),

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

export const adminBookingIdSchema = z.object({
  id: positiveIntSchema,
});

export const adminCreateRegisteredBookingSchema = z.object(
  registeredBookingFields,
);

export const adminCreateGuestBookingSchema = z.object(guestBookingFields);

export const adminCreateBookingSchema = z.discriminatedUnion("customer_type", [
  z.object({
    customer_type: z.literal("registered"),
    ...registeredBookingFields,
  }),

  z.object({
    customer_type: z.literal("guest"),
    ...guestBookingFields,
  }),
]);

export const adminConfirmBookingSchema = z.object({
  technician_id: positiveIntSchema,

  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),
});

export const adminRejectBookingSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(5000, "Rejection reason must not exceed 5000 characters"),
});

export const adminCancelBookingSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, "Cancellation reason is required")
    .max(5000, "Cancellation reason must not exceed 5000 characters"),
});
