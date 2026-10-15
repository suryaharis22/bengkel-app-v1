import { z } from "zod";

const positiveIntSchema = z
  .number({ message: "Value must be a number" })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

const nonNegativeNumberSchema = z
  .number({ message: "Price must be a number" })
  .finite("Price must be a valid number")
  .min(0, "Price must be greater than or equal to 0");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Service name is required")
  .max(150, "Service name must not exceed 150 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(10000, "Description must not exceed 10000 characters")
  .optional()
  .nullable();

const statusSchema = z.boolean({
  message: "Status must be a boolean",
});

export const workshopServiceIdSchema = z.object({
  id: positiveIntSchema,
});

export const workshopServiceQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  status: z
    .enum(["active", "inactive"], {
      message: "Status must be active or inactive",
    })
    .optional(),

  page: z.coerce
    .number({ message: "Page must be a number" })
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),

  per_page: z.coerce
    .number({ message: "Per page must be a number" })
    .int("Per page must be an integer")
    .positive("Per page must be greater than 0")
    .max(100, "Per page must not exceed 100")
    .default(20),
});

export const createWorkshopServiceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: nonNegativeNumberSchema,
  status: statusSchema.optional().default(true),
});

export const updateWorkshopServiceSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    price: nonNegativeNumberSchema.optional(),
    status: statusSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.price !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field must be provided",
    },
  );
