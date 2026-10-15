import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .toLowerCase(),

  no_hp: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required").trim(),

  password: z.string().min(1, "Password is required"),
});
