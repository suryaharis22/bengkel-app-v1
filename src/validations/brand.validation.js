import { z } from "zod";

export const createBrandSchema = z.object({
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

  logo_url: z
    .string()
    .max(255, "Logo URL must not exceed 255 characters")
    .optional()
    .or(z.literal("")),

  description: z.string().optional().or(z.literal("")),

  status: z.boolean().default(true),
});

export const updateBrandSchema = z.object({
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

  logo_url: z
    .string()
    .max(255, "Logo URL must not exceed 255 characters")
    .optional()
    .or(z.literal("")),

  description: z.string().optional().or(z.literal("")),

  status: z.boolean().optional(),
});
