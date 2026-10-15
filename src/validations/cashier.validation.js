import { z } from "zod";

const positiveIntSchema = z
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const moneySchema = z
  .number({
    message: "Value must be a number",
  })
  .finite("Value must be a valid number")
  .nonnegative("Value must not be negative");

const optionalMoneySchema = moneySchema.optional().default(0);

const optionalStringSchema = (max, message) =>
  z.string().trim().max(max, message).optional().nullable();

export const cashierProductQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  brands: z
    .string()
    .trim()
    .max(500, "Brands must not exceed 500 characters")
    .optional()
    .default("")
    .refine(
      (value) =>
        value === "" ||
        value.split(",").every((id) => /^[1-9]\d*$/.test(id.trim())),
      "Brands must contain comma-separated positive integer IDs",
    ),

  categories: z
    .string()
    .trim()
    .max(500, "Categories must not exceed 500 characters")
    .optional()
    .default("")
    .refine(
      (value) =>
        value === "" ||
        value.split(",").every((id) => /^[1-9]\d*$/.test(id.trim())),
      "Categories must contain comma-separated positive integer IDs",
    ),

  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),

  per_page: z.coerce
    .number()
    .int("Per page must be an integer")
    .positive("Per page must be greater than 0")
    .max(100, "Per page must not exceed 100")
    .default(20),
});

export const cashierCheckoutItemSchema = z.object({
  variant_id: positiveIntSchema,

  quantity: z
    .number({
      message: "Quantity must be a number",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .max(9999, "Quantity must not exceed 9999"),
});

export const cashierPaymentSchema = z.object({
  payment_method: z.enum(["cash", "qris", "transfer", "debit", "ewallet"], {
    message: "Invalid payment method",
  }),

  amount: moneySchema,

  reference_number: optionalStringSchema(
    100,
    "Reference number must not exceed 100 characters",
  ),
});

export const cashierCheckoutSchema = z.object({
  customer_id: positiveIntSchema.optional().nullable(),

  customer_name: optionalStringSchema(
    100,
    "Customer name must not exceed 100 characters",
  ),

  customer_phone: optionalStringSchema(
    30,
    "Customer phone must not exceed 30 characters",
  ),

  discount: optionalMoneySchema,

  tax: optionalMoneySchema,

  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),

  items: z
    .array(cashierCheckoutItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Items must not exceed 100"),

  payment: cashierPaymentSchema,
});

export const cashierSalesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: z.enum(["completed", "cancelled", "refunded"]).optional(),

  payment_status: z.enum(["unpaid", "partial", "paid", "refunded"]).optional(),

  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),

  per_page: z.coerce
    .number()
    .int("Per page must be an integer")
    .positive("Per page must be greater than 0")
    .max(100, "Per page must not exceed 100")
    .default(20),

  date_from: z.string().trim().optional(),

  date_to: z.string().trim().optional(),
});

export const cashierSaleIdSchema = z.object({
  id: positiveIntSchema,
});

export const cashierCancelSaleSchema = z.object({
  notes: optionalStringSchema(5000, "Notes must not exceed 5000 characters"),
});
