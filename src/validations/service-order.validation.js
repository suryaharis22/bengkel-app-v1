import { z } from "zod";

const positiveIntSchema = z.coerce
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const nonNegativeNumberSchema = z.coerce
  .number({
    message: "Value must be a number",
  })
  .finite("Value must be a valid number")
  .min(0, "Value must be greater than or equal to 0");

const optionalStringSchema = (max, message) =>
  z.string().trim().max(max, message).optional().nullable();

const serviceOrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

const servicePaymentStatusSchema = z.enum([
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);

export const serviceOrderQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: serviceOrderStatusSchema.optional(),

  payment_status: servicePaymentStatusSchema.optional(),

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

  technician_id: positiveIntSchema.optional(),

  customer_id: positiveIntSchema.optional(),
});

export const serviceOrderIdSchema = z.object({
  id: positiveIntSchema,
});

export const serviceOrderItemIdSchema = z.object({
  id: positiveIntSchema,
  item_id: positiveIntSchema,
});

export const serviceOrderSparePartItemIdSchema = z.object({
  id: positiveIntSchema,
  item_id: positiveIntSchema,
});

export const addServiceOrderServiceSchema = z.object({
  service_id: positiveIntSchema,

  quantity: positiveIntSchema.default(1),

  discount: nonNegativeNumberSchema.default(0),
});

export const addServiceOrderSparePartSchema = z.object({
  variant_id: positiveIntSchema,

  quantity: positiveIntSchema.default(1),

  discount: nonNegativeNumberSchema.default(0),
});

export const updateServiceOrderServiceSchema = z
  .object({
    quantity: positiveIntSchema.optional(),

    discount: nonNegativeNumberSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.quantity !== undefined || data.discount !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const updateServiceOrderSparePartSchema = z
  .object({
    quantity: positiveIntSchema.optional(),

    discount: nonNegativeNumberSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.quantity !== undefined || data.discount !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const updateServiceOrderDiagnosisSchema = z.object({
  diagnosis: z
    .string()
    .trim()
    .min(1, "Diagnosis is required")
    .max(5000, "Diagnosis must not exceed 5000 characters"),
});

export const updateServiceOrderNotesSchema = z.object({
  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),
});

export const completeServiceOrderSchema = z.object({
  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),
});

export const cancelServiceOrderSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, "Cancellation reason is required")
    .max(5000, "Cancellation reason must not exceed 5000 characters"),
});

export const assignServiceOrderTechnicianSchema = z.object({
  technician_id: positiveIntSchema,
});
