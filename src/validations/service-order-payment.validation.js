import { z } from "zod";

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const PAYMENT_METHODS = ["cash", "qris", "transfer", "debit", "ewallet"];

const MIDTRANS_PAYMENT_METHODS = ["qris", "transfer", "debit", "ewallet"];

/**
 * ============================================================
 * PAYMENT METHOD SCHEMA
 * ============================================================
 */

export const serviceOrderPaymentMethodSchema = z.enum(PAYMENT_METHODS);

/**
 * ============================================================
 * SERVICE ORDER ID
 * ============================================================
 */

export const serviceOrderPaymentIdSchema = z.object({
  id: z.coerce
    .number()
    .int("Service order ID must be an integer.")
    .positive("Service order ID must be greater than 0."),
});

/**
 * ============================================================
 * CASH PAYMENT
 * ============================================================
 *
 * Digunakan untuk:
 *
 * POST /api/admin/service-orders/:id/payment
 *
 * {
 *   "payment_method": "cash",
 *   "amount": 500000,
 *   "reference_number": "CASH-001"
 * }
 *
 * amount = uang yang diberikan customer.
 * Service akan menghitung change_amount.
 */

export const createCashServiceOrderPaymentSchema = z
  .object({
    payment_method: z.literal("cash").default("cash"),

    amount: z.coerce
      .number()
      .finite("Amount must be a valid number.")
      .positive("Amount must be greater than 0."),

    reference_number: z
      .string()
      .trim()
      .max(100, "Reference number must not exceed 100 characters.")
      .optional()
      .nullable(),
  })
  .strict();

/**
 * ============================================================
 * MIDTRANS PAYMENT
 * ============================================================
 *
 * Digunakan untuk:
 *
 * qris
 * transfer
 * debit
 * ewallet
 *
 * Contoh:
 *
 * {
 *   "payment_method": "qris"
 * }
 *
 * Amount tidak dikirim dari frontend karena nominal
 * harus diambil dari ServiceOrder.grand_total oleh backend.
 */

export const createMidtransServiceOrderPaymentSchema = z
  .object({
    payment_method: z.enum(MIDTRANS_PAYMENT_METHODS),

    reference_number: z
      .string()
      .trim()
      .max(100, "Reference number must not exceed 100 characters.")
      .optional()
      .nullable(),
  })
  .strict();

/**
 * ============================================================
 * CREATE PAYMENT
 * ============================================================
 *
 * Schema utama.
 *
 * Backend akan menentukan schema berdasarkan
 * payment_method.
 */

export const createServiceOrderPaymentSchema = z.discriminatedUnion(
  "payment_method",
  [
    createCashServiceOrderPaymentSchema,

    z.object({
      payment_method: z.literal("qris"),

      reference_number: z
        .string()
        .trim()
        .max(100, "Reference number must not exceed 100 characters.")
        .optional()
        .nullable(),
    }),

    z.object({
      payment_method: z.literal("transfer"),

      reference_number: z
        .string()
        .trim()
        .max(100, "Reference number must not exceed 100 characters.")
        .optional()
        .nullable(),
    }),

    z.object({
      payment_method: z.literal("debit"),

      reference_number: z
        .string()
        .trim()
        .max(100, "Reference number must not exceed 100 characters.")
        .optional()
        .nullable(),
    }),

    z.object({
      payment_method: z.literal("ewallet"),

      reference_number: z
        .string()
        .trim()
        .max(100, "Reference number must not exceed 100 characters.")
        .optional()
        .nullable(),
    }),
  ],
);

/**
 * ============================================================
 * PAYMENT QUERY
 * ============================================================
 *
 * Untuk endpoint:
 *
 * GET /api/admin/service-orders/:id/payment
 *
 * Contoh:
 *
 * ?include_history=true
 */

export const serviceOrderPaymentQuerySchema = z
  .object({
    include_history: z
      .union([
        z.boolean(),
        z
          .string()
          .transform((value) => value.toLowerCase())
          .pipe(z.enum(["true", "false"]))
          .transform((value) => value === "true"),
      ])
      .default(true),
  })
  .strict();

/**
 * ============================================================
 * MIDTRANS NOTIFICATION
 * ============================================================
 *
 * Payload yang dikirim Midtrans.
 *
 * Kita validasi field penting saja.
 * Field tambahan dari Midtrans tetap diperbolehkan.
 */

export const midtransNotificationSchema = z
  .object({
    transaction_time: z.string().optional(),

    transaction_status: z.string().min(1).optional(),

    transaction_id: z.string().min(1).optional(),

    status_message: z.string().optional(),

    status_code: z.string().min(1).optional(),

    signature_key: z.string().min(1),

    payment_type: z.string().min(1).optional(),

    order_id: z.string().min(1),

    merchant_id: z.string().optional(),

    gross_amount: z.union([z.number().finite(), z.string().min(1)]),

    fraud_status: z.string().optional(),

    currency: z.string().optional(),
  })
  .passthrough();

/**
 * ============================================================
 * PAYMENT ID PARAMS
 * ============================================================
 */

export const serviceOrderPaymentParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("Service order ID must be an integer.")
    .positive("Service order ID must be greater than 0."),
});

/**
 * ============================================================
 * HELPER
 * ============================================================
 *
 * Digunakan service/controller untuk mengetahui apakah
 * payment method menggunakan Midtrans.
 */

export function isMidtransPaymentMethod(paymentMethod) {
  return MIDTRANS_PAYMENT_METHODS.includes(paymentMethod);
}

/**
 * ============================================================
 * HELPER
 * ============================================================
 *
 * Digunakan untuk memastikan payment method valid.
 */

export function isValidServiceOrderPaymentMethod(paymentMethod) {
  return PAYMENT_METHODS.includes(paymentMethod);
}

/**
 * ============================================================
 * HELPER
 * ============================================================
 *
 * Mengembalikan provider berdasarkan payment method.
 *
 * cash      -> cash
 * qris      -> midtrans
 * transfer  -> midtrans
 * debit     -> midtrans
 * ewallet   -> midtrans
 */

export function getServiceOrderPaymentProvider(paymentMethod) {
  if (paymentMethod === "cash") {
    return "cash";
  }

  if (isMidtransPaymentMethod(paymentMethod)) {
    return "midtrans";
  }

  return null;
}
