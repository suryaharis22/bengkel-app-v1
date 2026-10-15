import { z } from "zod";

export const createSparePartImageSchema = z.object({
  image_url: z
    .string()
    .min(1, "Image URL is required")
    .max(255, "Image URL must not exceed 255 characters")
    .trim(),

  sort_order: z
    .number()
    .int("Sort order must be an integer")
    .nonnegative("Sort order must not be negative")
    .optional(),

  is_primary: z.boolean().optional(),
});

export const updateSparePartImageSchema = z
  .object({
    image_url: z
      .string()
      .min(1, "Image URL is required")
      .max(255, "Image URL must not exceed 255 characters")
      .trim()
      .optional(),

    sort_order: z
      .number()
      .int("Sort order must be an integer")
      .nonnegative("Sort order must not be negative")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const reorderSparePartImagesSchema = z.object({
  spare_part_id: z
    .number({
      message: "Spare part ID is required",
    })
    .int("Spare part ID must be an integer")
    .positive("Spare part ID must be greater than 0"),

  items: z
    .array(
      z.object({
        id: z
          .number()
          .int("Image ID must be an integer")
          .positive("Image ID must be greater than 0"),

        sort_order: z
          .number()
          .int("Sort order must be an integer")
          .nonnegative("Sort order must not be negative"),
      }),
    )
    .min(1, "At least one image is required"),
});
