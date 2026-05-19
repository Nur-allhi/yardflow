-- ──────────────────────────────────────────────
-- RLS POLICIES — YardFlow ERP
-- Apply via Supabase SQL Editor (Dashboard → SQL Editor)
-- ──────────────────────────────────────────────
-- IMPORTANT: These policies use auth.jwt() which works when
-- connecting through Supabase REST API (supabase-js client).
-- With direct postgres connection (current Drizzle setup),
-- the superuser role bypasses RLS.
-- The primary multi-tenancy enforcement is at application level.
-- ──────────────────────────────────────────────

-- 5.1 ORGANIZATIONS & AUTH
-- ─────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_owner_access" ON organizations
  FOR ALL
  USING (id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_users" ON users
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_session" ON sessions
  FOR ALL
  USING (user_id = auth.uid());

-- ─────────────────────────
-- 5.2 BANK & CASH ACCOUNTS
-- ─────────────────────────

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_accounts" ON accounts
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_account_transactions" ON account_transactions
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- ─────────────────────────
-- 5.3 INVENTORY
-- ─────────────────────────

ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_categories" ON material_categories
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE material_subtypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_subtypes" ON material_subtypes
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_stock_ledger" ON stock_ledger
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE scrap_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_scrap_pool" ON scrap_pool
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE consumables_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_consumables" ON consumables_log
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- ─────────────────────────
-- 5.4 VENDORS & PURCHASES
-- ─────────────────────────

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_vendors" ON vendors
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_purchases" ON purchases
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_purchase_items" ON purchase_items
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE purchase_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_purchase_payments" ON purchase_payments
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- ─────────────────────────
-- 5.5 CUSTOMERS & SALES
-- ─────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_customers" ON customers
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_sales" ON sales
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_sale_items" ON sale_items
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_sale_payments" ON sale_payments
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- ─────────────────────────
-- 5.6 HR & PAYROLL
-- ─────────────────────────

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_workers" ON workers
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE salary_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_salary_advances" ON salary_advances
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_salary_payments" ON salary_payments
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- ─────────────────────────
-- 5.7 PERIOD REPORTS
-- ─────────────────────────

ALTER TABLE period_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_period_reports" ON period_reports
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);
