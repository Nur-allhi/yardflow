import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
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
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
});

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
});

export const materialSubtypes = pgTable("material_subtypes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  category_id: uuid("category_id")
    .notNull()
    .references(() => materialCategories.id),
  name: text("name").notNull(),
  default_price_per_kg: decimal("default_price_per_kg", {
    precision: 10,
    scale: 2,
  }),
  unit: weightUnitEnum("unit").default("kg"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

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
});

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
});

export const consumablesLog = pgTable("consumables_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  item_name: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
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
});

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
});

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
});

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
});

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
});

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
});

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  customer_id: uuid("customer_id").references(() => customers.id),
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
});

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
});

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
});

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
});

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
});

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
});

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
});

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
  vendors: many(vendors),
  purchases: many(purchases),
  purchaseItems: many(purchaseItems),
  purchasePayments: many(purchasePayments),
  customers: many(customers),
  sales: many(sales),
  saleItems: many(saleItems),
  salePayments: many(salePayments),
  workers: many(workers),
  salaryAdvances: many(salaryAdvances),
  salaryPayments: many(salaryPayments),
  periodReports: many(periodReports),
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

export const consumablesLogRelations = relations(consumablesLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [consumablesLog.organization_id],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [consumablesLog.account_id],
    references: [accounts.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.organization_id],
    references: [organizations.id],
  }),
  purchases: many(purchases),
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

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organization_id],
    references: [organizations.id],
  }),
  sales: many(sales),
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

export type Vendor = InferSelectModel<typeof vendors>;
export type NewVendor = InferInsertModel<typeof vendors>;

export type Purchase = InferSelectModel<typeof purchases>;
export type NewPurchase = InferInsertModel<typeof purchases>;

export type PurchaseItem = InferSelectModel<typeof purchaseItems>;
export type NewPurchaseItem = InferInsertModel<typeof purchaseItems>;

export type PurchasePayment = InferSelectModel<typeof purchasePayments>;
export type NewPurchasePayment = InferInsertModel<typeof purchasePayments>;

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
