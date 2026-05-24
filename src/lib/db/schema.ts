import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// ──────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "paid"]);
export const roleEnum = pgEnum("role", ["owner", "manager", "worker"]);
export const accountTypeEnum = pgEnum("account_type", ["cash", "bank"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
]);
export const referenceTypeEnum = pgEnum("reference_type", [
  "purchase_payment",
  "sale_payment",
  "salary",
  "advance",
  "transfer",
  "other",
]);
export const movementTypeEnum = pgEnum("movement_type", ["in", "out"]);
export const stockReferenceTypeEnum = pgEnum("stock_reference_type", [
  "purchase",
  "sale_fabricated",
  "sale_raw",
  "adjustment",
]);
export const weightUnitEnum = pgEnum("weight_unit", ["kg", "ton"]);
export const vendorTypeEnum = pgEnum("vendor_type", [
  "shipyard",
  "consumable",
  "other",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "partial",
  "due",
]);
export const customerTypeEnum = pgEnum("customer_type", [
  "regular",
  "walk_in",
]);
export const saleTypeEnum = pgEnum("sale_type", [
  "fabricated",
  "raw_passthrough",
  "scrap",
]);
export const salaryStatusEnum = pgEnum("salary_status", [
  "pending",
  "partial",
  "paid",
]);
export const periodTypeEnum = pgEnum("period_type", [
  "monthly",
  "yearly",
  "custom",
]);
export const reportResultEnum = pgEnum("report_result", ["profit", "loss"]);
export const inventoryModeEnum = pgEnum("inventory_mode", ["detailed", "simple"]);
export const simpleMovementTypeEnum = pgEnum("simple_movement_type", [
  "purchase",
  "sale",
  "adjustment",
]);

// ──────────────────────────────────────────────
// 5.1 ORGANIZATIONS & AUTH
// ──────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  plan: planEnum("plan").default("free").notNull(),
  inventory_mode: inventoryModeEnum("inventory_mode").default("detailed").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_users_org").on(table.organization_id),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_sessions_user").on(table.user_id),
}));

// ──────────────────────────────────────────────
// 5.2 BANK & CASH ACCOUNTS
// ──────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  bank_name: text("bank_name"),
  account_number: text("account_number"),
  current_balance: decimal("current_balance", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_accounts_org").on(table.organization_id),
}));

export const accountTransactions = pgTable("account_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  reference_type: referenceTypeEnum("reference_type").notNull(),
  reference_id: uuid("reference_id"),
  note: text("note"),
  transaction_date: timestamp("transaction_date", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_account_transactions_org").on(table.organization_id),
  accountIdx: index("idx_account_transactions_account").on(table.account_id),
}));

// ──────────────────────────────────────────────
// 5.3 INVENTORY
// ──────────────────────────────────────────────

export const materialCategories = pgTable("material_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_material_categories_org").on(table.organization_id),
}));

export const materialSubtypes = pgTable("material_subtypes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  category_id: uuid("category_id")
    .notNull()
    .references(() => materialCategories.id),
  name: text("name").notNull(),
  unit: weightUnitEnum("unit").default("kg"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_material_subtypes_org").on(table.organization_id),
  categoryIdx: index("idx_material_subtypes_category").on(table.category_id),
}));

export const stockLedger = pgTable("stock_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  subtype_id: uuid("subtype_id")
    .notNull()
    .references(() => materialSubtypes.id),
  movement_type: movementTypeEnum("movement_type").notNull(),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 15, scale: 2 }),
  reference_type: stockReferenceTypeEnum("reference_type").notNull(),
  reference_id: uuid("reference_id"),
  movement_date: timestamp("movement_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_stock_ledger_org").on(table.organization_id),
  subtypeIdx: index("idx_stock_ledger_subtype").on(table.subtype_id),
  movementDateIdx: index("idx_stock_ledger_movement_date").on(table.movement_date),
}));

export const scrapPool = pgTable("scrap_pool", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  movement_type: movementTypeEnum("movement_type").notNull(),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  reference_id: uuid("reference_id"),
  movement_date: timestamp("movement_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_scrap_pool_org").on(table.organization_id),
  referenceIdx: index("idx_scrap_pool_reference_id").on(table.reference_id),
}));

export const consumablesLog = pgTable("consumables_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  item_name: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  stock_quantity: decimal("stock_quantity", { precision: 12, scale: 3 })
    .default("0")
    .notNull(),
  unit: text("unit"),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }),
  total_price: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  vendor_name: text("vendor_name"),
  account_id: uuid("account_id").references(() => accounts.id),
  purchase_date: timestamp("purchase_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_consumables_log_org").on(table.organization_id),
  accountIdx: index("idx_consumables_log_account").on(table.account_id),
}));

export const consumptionLogs = pgTable("consumption_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  consumable_id: uuid("consumable_id")
    .notNull()
    .references(() => consumablesLog.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  used_at: timestamp("used_at", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_consumption_logs_org").on(table.organization_id),
  consumableIdx: index("idx_consumption_logs_consumable").on(table.consumable_id),
}));

// ──────────────────────────────────────────────
// 5.4 VENDORS & PURCHASES
// ──────────────────────────────────────────────

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  type: vendorTypeEnum("type").notNull(),
  opening_balance: decimal("opening_balance", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_vendors_org").on(table.organization_id),
}));

export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  vendor_id: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  purchase_date: timestamp("purchase_date", { withTimezone: true }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paid_amount: decimal("paid_amount", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  due_amount: decimal("due_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`total_amount - paid_amount`)
    .notNull(),
  status: paymentStatusEnum("status").default("due").notNull(),
  note: text("note"),
  truck_fare: decimal("truck_fare", { precision: 12, scale: 2 }).default("0").notNull(),
  labour_cost: decimal("labour_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  food_cost: decimal("food_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_purchases_org").on(table.organization_id),
  vendorIdx: index("idx_purchases_vendor").on(table.vendor_id),
  purchaseDateIdx: index("idx_purchases_purchase_date").on(table.purchase_date),
}));

export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  subtype_id: uuid("subtype_id")
    .notNull()
    .references(() => materialSubtypes.id),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`quantity_kg * price_per_kg`)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_purchase_items_org").on(table.organization_id),
  purchaseIdx: index("idx_purchase_items_purchase").on(table.purchase_id),
  subtypeIdx: index("idx_purchase_items_subtype").on(table.subtype_id),
}));

export const purchasePayments = pgTable("purchase_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  payment_date: timestamp("payment_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_purchase_payments_org").on(table.organization_id),
  purchaseIdx: index("idx_purchase_payments_purchase").on(table.purchase_id),
  accountIdx: index("idx_purchase_payments_account").on(table.account_id),
}));

// ──────────────────────────────────────────────
// 5.5 CUSTOMERS & SALES
// ──────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  type: customerTypeEnum("type").default("regular").notNull(),
  opening_balance: decimal("opening_balance", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_customers_org").on(table.organization_id),
}));

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  customer_id: uuid("customer_id").references(() => customers.id),
  customer_name: text("customer_name"),
  sale_type: saleTypeEnum("sale_type").notNull(),
  is_quick_cash_sale: boolean("is_quick_cash_sale").default(false).notNull(),
  sale_date: timestamp("sale_date", { withTimezone: true }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paid_amount: decimal("paid_amount", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  due_amount: decimal("due_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`total_amount - paid_amount`)
    .notNull(),
  status: paymentStatusEnum("status").default("due").notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_sales_org").on(table.organization_id),
  customerIdx: index("idx_sales_customer").on(table.customer_id),
  saleDateIdx: index("idx_sales_sale_date").on(table.sale_date),
}));

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  sale_id: uuid("sale_id")
    .notNull()
    .references(() => sales.id),
  subtype_id: uuid("subtype_id").references(() => materialSubtypes.id),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`quantity_kg * price_per_kg`)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_sale_items_org").on(table.organization_id),
  saleIdx: index("idx_sale_items_sale").on(table.sale_id),
  subtypeIdx: index("idx_sale_items_subtype").on(table.subtype_id),
}));

export const salePayments = pgTable("sale_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  sale_id: uuid("sale_id")
    .notNull()
    .references(() => sales.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  payment_date: timestamp("payment_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_sale_payments_org").on(table.organization_id),
  saleIdx: index("idx_sale_payments_sale").on(table.sale_id),
  accountIdx: index("idx_sale_payments_account").on(table.account_id),
}));

// ──────────────────────────────────────────────
// 5.6 HR & PAYROLL
// ──────────────────────────────────────────────

export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  user_id: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone"),
  designation: text("designation"),
  monthly_salary: decimal("monthly_salary", { precision: 10, scale: 2 }).notNull(),
  join_date: timestamp("join_date", { withTimezone: true }),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_workers_org").on(table.organization_id),
}));

export const salaryAdvances = pgTable("salary_advances", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  worker_id: uuid("worker_id")
    .notNull()
    .references(() => workers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  advance_date: timestamp("advance_date", { withTimezone: true }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_salary_advances_org").on(table.organization_id),
  workerIdx: index("idx_salary_advances_worker").on(table.worker_id),
}));

export const salaryPayments = pgTable("salary_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  worker_id: uuid("worker_id")
    .notNull()
    .references(() => workers.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  base_salary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  total_advances: decimal("total_advances", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  net_payable: decimal("net_payable", { precision: 10, scale: 2 })
    .generatedAlwaysAs(sql`base_salary - total_advances`)
    .notNull(),
  paid_amount: decimal("paid_amount", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  payment_date: timestamp("payment_date", { withTimezone: true }),
  status: salaryStatusEnum("status").default("pending").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_salary_payments_org").on(table.organization_id),
  workerIdx: index("idx_salary_payments_worker").on(table.worker_id),
}));

// ──────────────────────────────────────────────
// 5.7 PERIOD REPORTS
// ──────────────────────────────────────────────

export const periodReports = pgTable("period_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  period_type: periodTypeEnum("period_type").notNull(),
  start_date: timestamp("start_date", { withTimezone: true }).notNull(),
  end_date: timestamp("end_date", { withTimezone: true }).notNull(),
  total_purchased_kg: decimal("total_purchased_kg", {
    precision: 15,
    scale: 3,
  }),
  total_sold_fabricated_kg: decimal("total_sold_fabricated_kg", {
    precision: 15,
    scale: 3,
  }),
  total_sold_raw_kg: decimal("total_sold_raw_kg", {
    precision: 15,
    scale: 3,
  }),
  total_scrap_sold_kg: decimal("total_scrap_sold_kg", {
    precision: 15,
    scale: 3,
  }),
  current_stock_kg: decimal("current_stock_kg", {
    precision: 15,
    scale: 3,
  }),
  burnout_kg: decimal("burnout_kg", { precision: 15, scale: 3 }),
  burnout_percent: decimal("burnout_percent", { precision: 5, scale: 2 }),
  total_income: decimal("total_income", { precision: 15, scale: 2 }),
  total_purchase_cost: decimal("total_purchase_cost", {
    precision: 15,
    scale: 2,
  }),
  total_consumables_cost: decimal("total_consumables_cost", {
    precision: 15,
    scale: 2,
  }),
  total_salary_cost: decimal("total_salary_cost", {
    precision: 15,
    scale: 2,
  }),
  total_other_expenses: decimal("total_other_expenses", {
    precision: 15,
    scale: 2,
  }),
  total_cost: decimal("total_cost", { precision: 15, scale: 2 }),
  net_profit: decimal("net_profit", { precision: 15, scale: 2 }),
  profit_per_kg: decimal("profit_per_kg", { precision: 10, scale: 2 }),
  result: reportResultEnum("result"),
  generated_at: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_period_reports_org").on(table.organization_id),
}));

// ──────────────────────────────────────────────
// ACTIVITY LOGS
// ──────────────────────────────────────────────

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  entity_type: text("entity_type").notNull(),
  entity_id: uuid("entity_id"),
  description: text("description").notNull(),
  changes: jsonb("changes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_activity_logs_org").on(table.organization_id),
  entityIdx: index("idx_activity_logs_entity").on(table.entity_type, table.entity_id),
  createdAtIdx: index("idx_activity_logs_created").on(table.created_at),
}));

// ──────────────────────────────────────────────
// 5.8 SIMPLE INVENTORY MODULE
// ──────────────────────────────────────────────

export const inventoryPool = pgTable("inventory_pool", {
  organization_id: uuid("organization_id")
    .notNull()
    .primaryKey()
    .references(() => organizations.id),
  total_quantity_kg: decimal("total_quantity_kg", { precision: 15, scale: 3 })
    .default("0")
    .notNull(),
  total_value: decimal("total_value", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  avg_price_per_kg: decimal("avg_price_per_kg", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`CASE WHEN total_quantity_kg = 0 THEN 0 ELSE total_value / total_quantity_kg END`)
    .notNull(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  movement_type: movementTypeEnum("movement_type").notNull(),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 15, scale: 2 }),
  reference_type: simpleMovementTypeEnum("reference_type").notNull(),
  reference_id: uuid("reference_id"),
  description: text("description"),
  movement_date: timestamp("movement_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("idx_inventory_movements_org").on(table.organization_id),
  movementDateIdx: index("idx_inventory_movements_date").on(table.movement_date),
  referenceIdx: index("idx_inventory_movements_reference").on(table.reference_type, table.reference_id),
}));

export const simplePurchases = pgTable("simple_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  vendor_id: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  purchase_date: timestamp("purchase_date", { withTimezone: true }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paid_amount: decimal("paid_amount", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  due_amount: decimal("due_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`total_amount - paid_amount`)
    .notNull(),
  status: paymentStatusEnum("status").default("due").notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_purchases_org").on(table.organization_id),
  vendorIdx: index("idx_simple_purchases_vendor").on(table.vendor_id),
  purchaseDateIdx: index("idx_simple_purchases_date").on(table.purchase_date),
}));

export const simplePurchaseItems = pgTable("simple_purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => simplePurchases.id),
  description: text("description").notNull(),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`quantity_kg * price_per_kg`)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_purchase_items_org").on(table.organization_id),
  purchaseIdx: index("idx_simple_purchase_items_purchase").on(table.purchase_id),
}));

export const simplePurchasePayments = pgTable("simple_purchase_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => simplePurchases.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  payment_date: timestamp("payment_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_purchase_payments_org").on(table.organization_id),
  purchaseIdx: index("idx_simple_purchase_payments_purchase").on(table.purchase_id),
  accountIdx: index("idx_simple_purchase_payments_account").on(table.account_id),
}));

export const simplePurchaseOtherExpenses = pgTable("simple_purchase_other_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => simplePurchases.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id").references(() => accounts.id),
  add_to_vendor_total: boolean("add_to_vendor_total").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_purch_other_exp_org").on(table.organization_id),
  purchaseIdx: index("idx_simple_purch_other_exp_purch").on(table.purchase_id),
  accountIdx: index("idx_simple_purch_other_exp_account").on(table.account_id),
}));

export const simpleSales = pgTable("simple_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  customer_id: uuid("customer_id").references(() => customers.id),
  customer_name: text("customer_name"),
  sale_type: saleTypeEnum("sale_type").notNull(),
  is_quick_cash_sale: boolean("is_quick_cash_sale").default(false).notNull(),
  sale_date: timestamp("sale_date", { withTimezone: true }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paid_amount: decimal("paid_amount", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  due_amount: decimal("due_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`total_amount - paid_amount`)
    .notNull(),
  status: paymentStatusEnum("status").default("due").notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_sales_org").on(table.organization_id),
  customerIdx: index("idx_simple_sales_customer").on(table.customer_id),
  saleDateIdx: index("idx_simple_sales_date").on(table.sale_date),
}));

export const simpleSaleItems = pgTable("simple_sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  sale_id: uuid("sale_id")
    .notNull()
    .references(() => simpleSales.id),
  description: text("description").notNull(),
  quantity_kg: decimal("quantity_kg", { precision: 12, scale: 3 }).notNull(),
  price_per_kg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 })
    .generatedAlwaysAs(sql`quantity_kg * price_per_kg`)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_sale_items_org").on(table.organization_id),
  saleIdx: index("idx_simple_sale_items_sale").on(table.sale_id),
}));

export const simpleSalePayments = pgTable("simple_sale_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  sale_id: uuid("sale_id")
    .notNull()
    .references(() => simpleSales.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  payment_date: timestamp("payment_date", { withTimezone: true }).notNull(),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_simple_sale_payments_org").on(table.organization_id),
  saleIdx: index("idx_simple_sale_payments_sale").on(table.sale_id),
  accountIdx: index("idx_simple_sale_payments_account").on(table.account_id),
}));

// ──────────────────────────────────────────────
// RELATIONS
// ──────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  accountTransactions: many(accountTransactions),
  materialCategories: many(materialCategories),
  materialSubtypes: many(materialSubtypes),
  stockLedgers: many(stockLedger),
  scrapPools: many(scrapPool),
  consumablesLogs: many(consumablesLog),
  consumptionLogs: many(consumptionLogs),
  vendors: many(vendors),
  purchases: many(purchases),
  purchaseItems: many(purchaseItems),
  purchasePayments: many(purchasePayments),
  purchaseOtherExpenses: many(purchaseOtherExpenses),
  customers: many(customers),
  sales: many(sales),
  saleItems: many(saleItems),
  salePayments: many(salePayments),
  workers: many(workers),
  salaryAdvances: many(salaryAdvances),
  salaryPayments: many(salaryPayments),
  simplePurchasePayments: many(simplePurchasePayments),
  simpleSalePayments: many(simpleSalePayments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organization_id],
    references: [organizations.id],
  }),
  sessions: many(sessions),
  workers: many(workers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organization_id],
    references: [organizations.id],
  }),
  transactions: many(accountTransactions),
  consumablesLogs: many(consumablesLog),
  purchasePayments: many(purchasePayments),
  salePayments: many(salePayments),
  salaryAdvances: many(salaryAdvances),
  salaryPayments: many(salaryPayments),
}));

export const accountTransactionsRelations = relations(
  accountTransactions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [accountTransactions.organization_id],
      references: [organizations.id],
    }),
    account: one(accounts, {
      fields: [accountTransactions.account_id],
      references: [accounts.id],
    }),
  }),
);

export const materialCategoriesRelations = relations(
  materialCategories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [materialCategories.organization_id],
      references: [organizations.id],
    }),
    subtypes: many(materialSubtypes),
  }),
);

export const materialSubtypesRelations = relations(
  materialSubtypes,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [materialSubtypes.organization_id],
      references: [organizations.id],
    }),
    category: one(materialCategories, {
      fields: [materialSubtypes.category_id],
      references: [materialCategories.id],
    }),
    stockLedgers: many(stockLedger),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
  }),
);

export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockLedger.organization_id],
    references: [organizations.id],
  }),
  subtype: one(materialSubtypes, {
    fields: [stockLedger.subtype_id],
    references: [materialSubtypes.id],
  }),
}));

export const scrapPoolRelations = relations(scrapPool, ({ one }) => ({
  organization: one(organizations, {
    fields: [scrapPool.organization_id],
    references: [organizations.id],
  }),
}));

export const consumablesLogRelations = relations(consumablesLog, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [consumablesLog.organization_id],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [consumablesLog.account_id],
    references: [accounts.id],
  }),
  consumptionLogs: many(consumptionLogs),
}));

export const consumptionLogsRelations = relations(consumptionLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [consumptionLogs.organization_id],
    references: [organizations.id],
  }),
  consumable: one(consumablesLog, {
    fields: [consumptionLogs.consumable_id],
    references: [consumablesLog.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.organization_id],
    references: [organizations.id],
  }),
  purchases: many(purchases),
  simplePurchases: many(simplePurchases),
}));

export const purchaseOtherExpenses = pgTable("purchase_other_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  purchase_id: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  account_id: uuid("account_id").references(() => accounts.id),
  add_to_vendor_total: boolean("add_to_vendor_total").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orgIdx: index("idx_purchase_other_expenses_org").on(table.organization_id),
  purchaseIdx: index("idx_purchase_other_expenses_purchase").on(table.purchase_id),
  accountIdx: index("idx_purchase_other_expenses_account").on(table.account_id),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchases.organization_id],
    references: [organizations.id],
  }),
  vendor: one(vendors, {
    fields: [purchases.vendor_id],
    references: [vendors.id],
  }),
  items: many(purchaseItems),
  payments: many(purchasePayments),
  otherExpenses: many(purchaseOtherExpenses),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  organization: one(organizations, {
    fields: [purchaseItems.organization_id],
    references: [organizations.id],
  }),
  purchase: one(purchases, {
    fields: [purchaseItems.purchase_id],
    references: [purchases.id],
  }),
  subtype: one(materialSubtypes, {
    fields: [purchaseItems.subtype_id],
    references: [materialSubtypes.id],
  }),
}));

export const purchasePaymentsRelations = relations(
  purchasePayments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [purchasePayments.organization_id],
      references: [organizations.id],
    }),
    purchase: one(purchases, {
      fields: [purchasePayments.purchase_id],
      references: [purchases.id],
    }),
    account: one(accounts, {
      fields: [purchasePayments.account_id],
      references: [accounts.id],
    }),
  }),
);

export const purchaseOtherExpensesRelations = relations(
  purchaseOtherExpenses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [purchaseOtherExpenses.organization_id],
      references: [organizations.id],
    }),
    purchase: one(purchases, {
      fields: [purchaseOtherExpenses.purchase_id],
      references: [purchases.id],
    }),
    account: one(accounts, {
      fields: [purchaseOtherExpenses.account_id],
      references: [accounts.id],
    }),
  }),
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organization_id],
    references: [organizations.id],
  }),
  sales: many(sales),
  simpleSales: many(simpleSales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sales.organization_id],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [sales.customer_id],
    references: [customers.id],
  }),
  items: many(saleItems),
  payments: many(salePayments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  organization: one(organizations, {
    fields: [saleItems.organization_id],
    references: [organizations.id],
  }),
  sale: one(sales, {
    fields: [saleItems.sale_id],
    references: [sales.id],
  }),
  subtype: one(materialSubtypes, {
    fields: [saleItems.subtype_id],
    references: [materialSubtypes.id],
  }),
}));

export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [salePayments.organization_id],
    references: [organizations.id],
  }),
  sale: one(sales, {
    fields: [salePayments.sale_id],
    references: [sales.id],
  }),
  account: one(accounts, {
    fields: [salePayments.account_id],
    references: [accounts.id],
  }),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workers.organization_id],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [workers.user_id],
    references: [users.id],
  }),
  salaryAdvances: many(salaryAdvances),
  salaryPayments: many(salaryPayments),
}));

export const salaryAdvancesRelations = relations(
  salaryAdvances,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [salaryAdvances.organization_id],
      references: [organizations.id],
    }),
    worker: one(workers, {
      fields: [salaryAdvances.worker_id],
      references: [workers.id],
    }),
    account: one(accounts, {
      fields: [salaryAdvances.account_id],
      references: [accounts.id],
    }),
  }),
);

export const salaryPaymentsRelations = relations(
  salaryPayments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [salaryPayments.organization_id],
      references: [organizations.id],
    }),
    worker: one(workers, {
      fields: [salaryPayments.worker_id],
      references: [workers.id],
    }),
    account: one(accounts, {
      fields: [salaryPayments.account_id],
      references: [accounts.id],
    }),
  }),
);

export const periodReportsRelations = relations(periodReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [periodReports.organization_id],
    references: [organizations.id],
  }),
}));

// ──────────────────────────────────────────────
// SIMPLE INVENTORY RELATIONS
// ──────────────────────────────────────────────

export const inventoryPoolRelations = relations(inventoryPool, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryPool.organization_id],
    references: [organizations.id],
  }),
}));

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [inventoryMovements.organization_id],
      references: [organizations.id],
    }),
  }),
);

export const simplePurchasesRelations = relations(
  simplePurchases,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [simplePurchases.organization_id],
      references: [organizations.id],
    }),
    vendor: one(vendors, {
      fields: [simplePurchases.vendor_id],
      references: [vendors.id],
    }),
    items: many(simplePurchaseItems),
    payments: many(simplePurchasePayments),
    otherExpenses: many(simplePurchaseOtherExpenses),
  }),
);

export const simplePurchaseOtherExpensesRelations = relations(
  simplePurchaseOtherExpenses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [simplePurchaseOtherExpenses.organization_id],
      references: [organizations.id],
    }),
    purchase: one(simplePurchases, {
      fields: [simplePurchaseOtherExpenses.purchase_id],
      references: [simplePurchases.id],
    }),
    account: one(accounts, {
      fields: [simplePurchaseOtherExpenses.account_id],
      references: [accounts.id],
    }),
  }),
);

export const simplePurchaseItemsRelations = relations(
  simplePurchaseItems,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [simplePurchaseItems.organization_id],
      references: [organizations.id],
    }),
    purchase: one(simplePurchases, {
      fields: [simplePurchaseItems.purchase_id],
      references: [simplePurchases.id],
    }),
  }),
);

export const simplePurchasePaymentsRelations = relations(
  simplePurchasePayments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [simplePurchasePayments.organization_id],
      references: [organizations.id],
    }),
    purchase: one(simplePurchases, {
      fields: [simplePurchasePayments.purchase_id],
      references: [simplePurchases.id],
    }),
    account: one(accounts, {
      fields: [simplePurchasePayments.account_id],
      references: [accounts.id],
    }),
  }),
);

export const simpleSalesRelations = relations(
  simpleSales,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [simpleSales.organization_id],
      references: [organizations.id],
    }),
    customer: one(customers, {
      fields: [simpleSales.customer_id],
      references: [customers.id],
    }),
    items: many(simpleSaleItems),
    payments: many(simpleSalePayments),
  }),
);

export const simpleSaleItemsRelations = relations(
  simpleSaleItems,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [simpleSaleItems.organization_id],
      references: [organizations.id],
    }),
    sale: one(simpleSales, {
      fields: [simpleSaleItems.sale_id],
      references: [simpleSales.id],
    }),
  }),
);

export const simpleSalePaymentsRelations = relations(
  simpleSalePayments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [simpleSalePayments.organization_id],
      references: [organizations.id],
    }),
    sale: one(simpleSales, {
      fields: [simpleSalePayments.sale_id],
      references: [simpleSales.id],
    }),
    account: one(accounts, {
      fields: [simpleSalePayments.account_id],
      references: [accounts.id],
    }),
  }),
);

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type AccountTransaction = InferSelectModel<typeof accountTransactions>;
export type NewAccountTransaction = InferInsertModel<typeof accountTransactions>;

export type MaterialCategory = InferSelectModel<typeof materialCategories>;
export type NewMaterialCategory = InferInsertModel<typeof materialCategories>;

export type MaterialSubtype = InferSelectModel<typeof materialSubtypes>;
export type NewMaterialSubtype = InferInsertModel<typeof materialSubtypes>;

export type StockLedgerEntry = InferSelectModel<typeof stockLedger>;
export type NewStockLedgerEntry = InferInsertModel<typeof stockLedger>;

export type ScrapPoolEntry = InferSelectModel<typeof scrapPool>;
export type NewScrapPoolEntry = InferInsertModel<typeof scrapPool>;

export type ConsumablesLogEntry = InferSelectModel<typeof consumablesLog>;
export type NewConsumablesLogEntry = InferInsertModel<typeof consumablesLog>;

export type ConsumptionLogEntry = InferSelectModel<typeof consumptionLogs>;
export type NewConsumptionLogEntry = InferInsertModel<typeof consumptionLogs>;

export type Vendor = InferSelectModel<typeof vendors>;
export type NewVendor = InferInsertModel<typeof vendors>;

export type Purchase = InferSelectModel<typeof purchases>;
export type NewPurchase = InferInsertModel<typeof purchases>;

export type PurchaseItem = InferSelectModel<typeof purchaseItems>;
export type NewPurchaseItem = InferInsertModel<typeof purchaseItems>;

export type PurchasePayment = InferSelectModel<typeof purchasePayments>;
export type NewPurchasePayment = InferInsertModel<typeof purchasePayments>;

export type PurchaseOtherExpense = InferSelectModel<typeof purchaseOtherExpenses>;
export type NewPurchaseOtherExpense = InferInsertModel<typeof purchaseOtherExpenses>;

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

export type Sale = InferSelectModel<typeof sales>;
export type NewSale = InferInsertModel<typeof sales>;

export type SaleItem = InferSelectModel<typeof saleItems>;
export type NewSaleItem = InferInsertModel<typeof saleItems>;

export type SalePayment = InferSelectModel<typeof salePayments>;
export type NewSalePayment = InferInsertModel<typeof salePayments>;

export type Worker = InferSelectModel<typeof workers>;
export type NewWorker = InferInsertModel<typeof workers>;

export type SalaryAdvance = InferSelectModel<typeof salaryAdvances>;
export type NewSalaryAdvance = InferInsertModel<typeof salaryAdvances>;

export type SalaryPayment = InferSelectModel<typeof salaryPayments>;
export type NewSalaryPayment = InferInsertModel<typeof salaryPayments>;

export type PeriodReport = InferSelectModel<typeof periodReports>;
export type NewPeriodReport = InferInsertModel<typeof periodReports>;

export type ActivityLog = InferSelectModel<typeof activityLogs>;
export type NewActivityLog = InferInsertModel<typeof activityLogs>;

// Simple Inventory
export type InventoryPool = InferSelectModel<typeof inventoryPool>;
export type NewInventoryPool = InferInsertModel<typeof inventoryPool>;
export type InventoryMovement = InferSelectModel<typeof inventoryMovements>;
export type NewInventoryMovement = InferInsertModel<typeof inventoryMovements>;
export type SimplePurchase = InferSelectModel<typeof simplePurchases>;
export type NewSimplePurchase = InferInsertModel<typeof simplePurchases>;
export type SimplePurchaseItem = InferSelectModel<typeof simplePurchaseItems>;
export type NewSimplePurchaseItem = InferInsertModel<typeof simplePurchaseItems>;
export type SimplePurchasePayment = InferSelectModel<typeof simplePurchasePayments>;
export type NewSimplePurchasePayment = InferInsertModel<typeof simplePurchasePayments>;
export type SimpleSale = InferSelectModel<typeof simpleSales>;
export type NewSimpleSale = InferInsertModel<typeof simpleSales>;
export type SimpleSaleItem = InferSelectModel<typeof simpleSaleItems>;
export type NewSimpleSaleItem = InferInsertModel<typeof simpleSaleItems>;
export type SimpleSalePayment = InferSelectModel<typeof simpleSalePayments>;
export type NewSimpleSalePayment = InferInsertModel<typeof simpleSalePayments>;
