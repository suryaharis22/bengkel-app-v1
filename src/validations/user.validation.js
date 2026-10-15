import { z } from "zod";
import { ROLE_VALUES } from "@/constants/roles";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),

  email: z.string().email("Invalid email address"),

  no_hp: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),

  role: z.enum(ROLE_VALUES).default("customer"),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .optional(),

  email: z.string().email("Invalid email address").optional(),

  no_hp: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters")
    .optional(),

  role: z.enum(ROLE_VALUES).optional(),
});
