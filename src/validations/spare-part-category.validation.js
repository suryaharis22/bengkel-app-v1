import { z } from "zod";

export const createSparePartCategorySchema = z.object({
  parent_id: z
    .number()
    .int("Parent category ID must be an integer")
    .positive("Parent category ID must be greater than 0")
    .optional()
    .nullable(),

  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120, "Slug must not exceed 120 characters")
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),

  description: z.string().optional().or(z.literal("")),

  image_url: z
    .string()
    .max(255, "Image URL must not exceed 255 characters")
    .optional()
    .or(z.literal("")),

  sort_order: z
    .number()
    .int("Sort order must be an integer")
    .nonnegative("Sort order must not be negative")
    .default(0),

  status: z.boolean().default(true),
});

export const updateSparePartCategorySchema = z.object({
  parent_id: z
    .number()
    .int("Parent category ID must be an integer")
    .positive("Parent category ID must be greater than 0")
    .optional()
    .nullable(),

  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters")
    .trim()
    .optional(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120, "Slug must not exceed 120 characters")
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    )
    .optional(),

  description: z.string().optional().or(z.literal("")),

  image_url: z
    .string()
    .max(255, "Image URL must not exceed 255 characters")
    .optional()
    .or(z.literal("")),

  sort_order: z
    .number()
    .int("Sort order must be an integer")
    .nonnegative("Sort order must not be negative")
    .optional(),

  status: z.boolean().optional(),
});
