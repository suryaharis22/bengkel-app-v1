import { z } from "zod";

export const createSparePartVariantSchema = z.object({
  name: z
    .string()
    .min(1, "Variant name is required")
    .max(100, "Variant name must not exceed 100 characters")
    .trim(),

  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must not exceed 50 characters")
    .trim(),

  price: z
    .number({
      message: "Price is required",
    })
    .nonnegative("Price must not be negative"),

  compare_price: z
    .number()
    .nonnegative("Compare price must not be negative")
    .optional()
    .nullable(),

  cost_price: z
    .number()
    .nonnegative("Cost price must not be negative")
    .optional()
    .nullable(),

  weight: z
    .number()
    .int("Weight must be an integer")
    .nonnegative("Weight must not be negative")
    .optional()
    .nullable(),

  status: z.boolean().default(true),
});

export const updateSparePartVariantSchema = z
  .object({
    name: z
      .string()
      .min(1, "Variant name is required")
      .max(100, "Variant name must not exceed 100 characters")
      .trim()
      .optional(),

    sku: z
      .string()
      .min(1, "SKU is required")
      .max(50, "SKU must not exceed 50 characters")
      .trim()
      .optional(),

    price: z.number().nonnegative("Price must not be negative").optional(),

    compare_price: z
      .number()
      .nonnegative("Compare price must not be negative")
      .optional()
      .nullable(),

    cost_price: z
      .number()
      .nonnegative("Cost price must not be negative")
      .optional()
      .nullable(),

    weight: z
      .number()
      .int("Weight must be an integer")
      .nonnegative("Weight must not be negative")
      .optional()
      .nullable(),

    status: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
