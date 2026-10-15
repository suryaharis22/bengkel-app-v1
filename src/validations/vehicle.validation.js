import { z } from "zod";

/*
|--------------------------------------------------------------------------
| COMMON SCHEMAS
|--------------------------------------------------------------------------
*/

/**
 * Positive integer.
 *
 * Uses z.coerce.number() so values such as:
 *
 * 3
 * "3"
 *
 * are both accepted and converted into:
 *
 * 3
 */
const positiveIntSchema = z.coerce
  .number({
    message: "Value must be a number",
  })
  .int("Value must be an integer")
  .positive("Value must be greater than 0");

/**
 * Required string.
 */
const requiredStringSchema = (max, message) =>
  z.string().trim().min(1, "This field is required").max(max, message);

/**
 * Optional string.
 */
const optionalStringSchema = (max, message) =>
  z.string().trim().max(max, message).optional().nullable();

/**
 * Optional vehicle year.
 *
 * Accepts:
 * - 2020
 * - "2020"
 * - null
 * - undefined
 */
const optionalYearSchema = z.coerce
  .number({
    message: "Year must be a number",
  })
  .int("Year must be an integer")
  .min(1900, "Year must be greater than or equal to 1900")
  .max(new Date().getFullYear() + 1, "Year must not be in the distant future")
  .optional()
  .nullable();

/*
|--------------------------------------------------------------------------
| VEHICLE QUERY
|--------------------------------------------------------------------------
*/

export const vehicleQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

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

/*
|--------------------------------------------------------------------------
| VEHICLE ID
|--------------------------------------------------------------------------
*/

export const vehicleIdSchema = z.object({
  id: positiveIntSchema,
});

/*
|--------------------------------------------------------------------------
| CUSTOMER CREATE VEHICLE
|--------------------------------------------------------------------------
*/

export const createCustomerVehicleSchema = z.object({
  plate_number: requiredStringSchema(
    20,
    "Plate number must not exceed 20 characters",
  ),

  brand: requiredStringSchema(100, "Brand must not exceed 100 characters"),

  model: requiredStringSchema(100, "Model must not exceed 100 characters"),

  year: optionalYearSchema,

  color: optionalStringSchema(50, "Color must not exceed 50 characters"),
});

/*
|--------------------------------------------------------------------------
| GUEST CREATE VEHICLE
|--------------------------------------------------------------------------
*/

export const createGuestVehicleSchema = z.object({
  plate_number: requiredStringSchema(
    20,
    "Plate number must not exceed 20 characters",
  ),

  brand: requiredStringSchema(100, "Brand must not exceed 100 characters"),

  model: requiredStringSchema(100, "Model must not exceed 100 characters"),

  year: optionalYearSchema,

  color: optionalStringSchema(50, "Color must not exceed 50 characters"),
});

/*
|--------------------------------------------------------------------------
| ADMIN CREATE VEHICLE
|--------------------------------------------------------------------------
*/

export const createAdminVehicleSchema = z.object({
  user_id: positiveIntSchema.optional().nullable(),

  plate_number: requiredStringSchema(
    20,
    "Plate number must not exceed 20 characters",
  ),

  brand: requiredStringSchema(100, "Brand must not exceed 100 characters"),

  model: requiredStringSchema(100, "Model must not exceed 100 characters"),

  year: optionalYearSchema,

  color: optionalStringSchema(50, "Color must not exceed 50 characters"),
});

/*
|--------------------------------------------------------------------------
| CUSTOMER UPDATE VEHICLE
|--------------------------------------------------------------------------
*/

export const updateCustomerVehicleSchema = z
  .object({
    plate_number: requiredStringSchema(
      20,
      "Plate number must not exceed 20 characters",
    ).optional(),

    brand: requiredStringSchema(
      100,
      "Brand must not exceed 100 characters",
    ).optional(),

    model: requiredStringSchema(
      100,
      "Model must not exceed 100 characters",
    ).optional(),

    year: optionalYearSchema,

    color: optionalStringSchema(50, "Color must not exceed 50 characters"),
  })
  .refine(
    (data) =>
      data.plate_number !== undefined ||
      data.brand !== undefined ||
      data.model !== undefined ||
      data.year !== undefined ||
      data.color !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

/*
|--------------------------------------------------------------------------
| ADMIN UPDATE VEHICLE
|--------------------------------------------------------------------------
*/

export const updateAdminVehicleSchema = z
  .object({
    user_id: positiveIntSchema.optional().nullable(),

    plate_number: requiredStringSchema(
      20,
      "Plate number must not exceed 20 characters",
    ).optional(),

    brand: requiredStringSchema(
      100,
      "Brand must not exceed 100 characters",
    ).optional(),

    model: requiredStringSchema(
      100,
      "Model must not exceed 100 characters",
    ).optional(),

    year: optionalYearSchema,

    color: optionalStringSchema(50, "Color must not exceed 50 characters"),
  })
  .refine(
    (data) =>
      data.user_id !== undefined ||
      data.plate_number !== undefined ||
      data.brand !== undefined ||
      data.model !== undefined ||
      data.year !== undefined ||
      data.color !== undefined,
    {
      message: "At least one field must be provided",
    },
  );
