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
  truck_fare: z.number().positive().optional(),
  labour_cost: z.number().positive().optional(),
  food_cost: z.number().positive().optional(),
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

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["regular", "walk_in"]).optional(),
  opening_balance: z.number().optional(),
});

export const saleItemSchema = z.object({
  subtype_id: z.string().uuid("Invalid subtype"),
  quantity_kg: z.number().positive("Quantity must be positive"),
  price_per_kg: z.number().positive("Price must be positive"),
});

export const quickSaleSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  items: z.array(saleItemSchema).min(1, "At least one item required"),
  amount_received: z.number().min(0, "Amount must be >= 0"),
  account_id: z.string().uuid("Invalid account"),
  note: z.string().optional(),
});

export const saleSchema = z.object({
  customer_id: z.string().uuid("Invalid customer").nullable().optional(),
  sale_type: z.enum(["fabricated", "raw_passthrough", "scrap"]),
  is_quick_cash_sale: z.boolean().optional(),
  sale_date: z.string().min(1, "Date is required"),
  items: z.array(saleItemSchema).min(1, "At least one item required"),
  amount_received: z.number().min(0).optional(),
  account_id: z.string().uuid("Invalid account").optional(),
  note: z.string().optional(),
});

export const scrapSaleSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  quantity_kg: z.number().positive("Quantity must be positive"),
  price_per_kg: z.number().positive("Price must be positive"),
  buyer_name: z.string().optional(),
  amount_received: z.number().min(0, "Amount must be >= 0"),
  account_id: z.string().uuid("Invalid account"),
  note: z.string().optional(),
});

export const salePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  account_id: z.string().uuid("Invalid account"),
  payment_date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["cash", "bank"]),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  opening_balance: z.number().optional(),
});

export const accountTransferSchema = z.object({
  from_account_id: z.string().uuid("Invalid source account"),
  to_account_id: z.string().uuid("Invalid destination account"),
  amount: z.number().positive("Amount must be positive"),
  transfer_date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export const generateReportSchema = z.object({
  period_type: z.enum(["monthly", "yearly", "custom"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  total_other_expenses: z.number().optional().default(0),
});

export const workerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  monthly_salary: z.number().positive("Salary must be positive"),
  join_date: z.string().optional(),
});

export const advanceSchema = z.object({
  worker_id: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  account_id: z.string().uuid(),
  advance_date: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number(),
  note: z.string().optional(),
});

export const salaryPaymentSchema = z.object({
  worker_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number(),
  paid_amount: z.number().positive(),
  account_id: z.string().uuid(),
  payment_date: z.string().min(1),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type AccountTransferInput = z.infer<typeof accountTransferSchema>;
export type AdvanceInput = z.infer<typeof advanceSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type SalePaymentInput = z.infer<typeof salePaymentSchema>;
export type SalaryPaymentInput = z.infer<typeof salaryPaymentSchema>;
export type WorkerInput = z.infer<typeof workerSchema>;
