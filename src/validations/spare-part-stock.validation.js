import { z } from "zod";

export const updateSparePartStockSchema = z.object({
  minimum_stock: z
    .number({
      message: "Minimum stock is required",
    })
    .int("Minimum stock must be an integer")
    .nonnegative("Minimum stock must not be negative"),
});

export const adjustSparePartStockSchema = z.object({
  type: z.enum(["in", "out"], {
    message: "Adjustment type must be either in or out",
  }),

  quantity: z
    .number({
      message: "Quantity is required",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),

  note: z
    .string()
    .max(255, "Note must not exceed 255 characters")
    .trim()
    .optional()
    .or(z.literal("")),
});
