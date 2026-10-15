import { z } from "zod";

const nullableNumber = z
  .number({
    message: "Value must be a number",
  })
  .nonnegative("Value must not be negative")
  .nullable()
  .optional();

const nullableInteger = z
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .nonnegative("Value must not be negative")
  .nullable()
  .optional();

export const createSparePartSchema = z.object({
  name: z
    .string()
    .min(1, "Spare part name is required")
    .max(150, "Spare part name must not exceed 150 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Spare part slug is required")
    .max(180, "Spare part slug must not exceed 180 characters")
    .trim(),

  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must not exceed 50 characters")
    .trim(),

  part_number: z
    .string()
    .max(100, "Part number must not exceed 100 characters")
    .trim()
    .nullable()
    .optional(),

  category_id: z
    .number({
      message: "Category is required",
    })
    .int("Category ID must be an integer")
    .positive("Category is required"),

  brand_id: z
    .number({
      message: "Brand is required",
    })
    .int("Brand ID must be an integer")
    .positive("Brand is required"),

  description: z.string().nullable().optional(),

  short_description: z
    .string()
    .max(255, "Short description must not exceed 255 characters")
    .nullable()
    .optional(),

  price: z
    .number({
      message: "Price is required",
    })
    .nonnegative("Price must not be negative"),

  compare_price: nullableNumber,

  cost_price: nullableNumber,

  weight: nullableInteger,

  status: z.enum(["draft", "active", "inactive"]),

  is_featured: z.boolean().default(false),
});

export const updateSparePartSchema = z
  .object({
    name: z
      .string()
      .min(1, "Spare part name is required")
      .max(150, "Spare part name must not exceed 150 characters")
      .trim(),

    slug: z
      .string()
      .min(1, "Spare part slug is required")
      .max(180, "Spare part slug must not exceed 180 characters")
      .trim(),

    sku: z
      .string()
      .min(1, "SKU is required")
      .max(50, "SKU must not exceed 50 characters")
      .trim(),

    part_number: z
      .string()
      .max(100, "Part number must not exceed 100 characters")
      .trim()
      .nullable()
      .optional(),

    category_id: z
      .number({
        message: "Category is required",
      })
      .int("Category ID must be an integer")
      .positive("Category is required"),

    brand_id: z
      .number({
        message: "Brand is required",
      })
      .int("Brand ID must be an integer")
      .positive("Brand is required"),

    description: z.string().nullable().optional(),

    short_description: z
      .string()
      .max(255, "Short description must not exceed 255 characters")
      .nullable()
      .optional(),

    price: z
      .number({
        message: "Price is required",
      })
      .nonnegative("Price must not be negative"),

    compare_price: nullableNumber,

    cost_price: nullableNumber,

    weight: nullableInteger,

    status: z.enum(["draft", "active", "inactive"]),

    is_featured: z.boolean(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
