// ==============================================================================
// DOCUMENT, PAYMENT & ADMIN VALIDATION SCHEMAS
// ==============================================================================

import { z } from "zod";

// Document schemas
export const DocumentVerificationStatusEnum = z.enum([
  "NOT_REQUIRED",
  "PENDING",
  "UPLOADED",
  "VERIFIED",
  "REJECTED",
]);

export const ReviewDocumentSchema = z.object({
  document_id: z.string().uuid("Invalid document ID"),
  status: DocumentVerificationStatusEnum,
  rejection_reason: z.string().optional().nullable(),
});

// Payment schemas
export const PaymentStatusEnum = z.enum([
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

export const VerifyPaymentWebhookSchema = z.object({
  order_id: z.string().min(1),
  payment_id: z.string().min(1),
  signature: z.string().min(1),
  amount: z.number().positive(),
});

// Admin schemas
export const AdminRoleEnum = z.enum([
  "SUPER_ADMIN",
  "EVENT_ADMIN",
  "REGISTRATION_ADMIN",
  "FINANCE_ADMIN",
  "DOCUMENT_ADMIN",
  "CONTENT_ADMIN",
  "VIEWER",
]);

export const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const CreateAdminUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name required").max(255),
  role: AdminRoleEnum.default("VIEWER"),
});
