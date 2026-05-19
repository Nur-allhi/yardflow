import { z } from "zod";

export const registerSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  owner_name: z.string().min(1, "Owner name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["shipyard", "consumable", "other"]),
  opening_balance: z.number().optional(),
});

export const purchaseItemSchema = z.object({
  subtype_id: z.string().uuid("Invalid subtype"),
  quantity_kg: z.number().positive("Quantity must be positive"),
  price_per_kg: z.number().positive("Price must be positive"),
});

export const purchaseSchema = z.object({
  vendor_id: z.string().uuid("Invalid vendor"),
  purchase_date: z.string().min(1, "Date is required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item required"),
  note: z.string().optional(),
});

export const purchasePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  account_id: z.string().uuid("Invalid account"),
  payment_date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export type VendorInput = z.infer<typeof vendorSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchasePaymentInput = z.infer<typeof purchasePaymentSchema>;
