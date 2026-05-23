import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function seed() {
  const users = await sql`SELECT id, organization_id FROM users LIMIT 1`;
  if (!users.length) {
    console.error("No user found. Register first.");
    process.exit(1);
  }

  const orgId = users[0].organization_id;
  const today = new Date();
  const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
  const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  // ── 1. Accounts ──
  const [cashAcc] = await sql`
    INSERT INTO accounts (organization_id, name, type, is_active)
    VALUES (${orgId}, 'Cash', 'cash', true)
    RETURNING id, name
  `;

  const [bankAcc] = await sql`
    INSERT INTO accounts (organization_id, name, type, bank_name, account_number, is_active)
    VALUES (${orgId}, 'Dutch Bangla Bank', 'bank', 'DBBL Ltd.', 'DBBL-1234-5678', true)
    RETURNING id, name
  `;
  console.log("✓ Accounts created");

  // ── 2. Categories ──
  const [catPlates] = await sql`
    INSERT INTO material_categories (organization_id, name)
    VALUES (${orgId}, 'Iron Plates') RETURNING id
  `;
  const [catAngle] = await sql`
    INSERT INTO material_categories (organization_id, name)
    VALUES (${orgId}, 'Angle Iron') RETURNING id
  `;
  console.log("✓ Categories created");

  // ── 3. Subtypes ──
  const pData = [
    { n: "5-8mm", p: 110 }, { n: "9-11mm", p: 95 }, { n: "12-13mm", p: 92 },
  ];
  const plateST = [];
  for (const st of pData) {
    const [r] = await sql`
      INSERT INTO material_subtypes (organization_id, category_id, name)
      VALUES (${orgId}, ${catPlates.id}, ${st.n}) RETURNING id
    `;
    plateST.push(r);
  }

  const [angleST] = await sql`
    INSERT INTO material_subtypes (organization_id, category_id, name)
    VALUES (${orgId}, ${catAngle.id}, '2 inch') RETURNING id
  `;
  console.log("✓ Subtypes created");

  // ── 4. Vendors ──
  const [v1] = await sql`
    INSERT INTO vendors (organization_id, name, phone, address, type)
    VALUES (${orgId}, 'Bashundhara Steel', '01711-111111', 'Kawran Bazar, Dhaka', 'shipyard')
    RETURNING id
  `;
  const [v2] = await sql`
    INSERT INTO vendors (organization_id, name, phone, address, type)
    VALUES (${orgId}, 'Rahim Shipyard', '01711-222222', 'Sitakunda, Chattogram', 'shipyard')
    RETURNING id
  `;
  console.log("✓ Vendors created");

  // ── 5. Customers ──
  const [c1] = await sql`
    INSERT INTO customers (organization_id, name, phone, address, type)
    VALUES (${orgId}, 'Akbar Traders', '01811-333333', 'Chawk Bazar, Dhaka', 'regular')
    RETURNING id
  `;
  const [c2] = await sql`
    INSERT INTO customers (organization_id, name, phone, address, type, opening_balance)
    VALUES (${orgId}, 'Kamal Fabrication', '01811-444444', 'Tejgaon, Dhaka', 'regular', '25000')
    RETURNING id
  `;
  console.log("✓ Customers created");

  // ── 6. Purchase 1 (paid) ──
  const [p1] = await sql`
    INSERT INTO purchases (organization_id, vendor_id, purchase_date, total_amount, paid_amount, status, note)
    VALUES (${orgId}, ${v1.id}, ${lastWeek}, '55000', '55000', 'paid', 'First purchase from Bashundhara')
    RETURNING id
  `;
  await sql`
    INSERT INTO purchase_items (organization_id, purchase_id, subtype_id, quantity_kg, price_per_kg)
    VALUES (${orgId}, ${p1.id}, ${plateST[0].id}, '500.000', '110.00')
  `;
  await sql`
    INSERT INTO stock_ledger (organization_id, subtype_id, movement_type, quantity_kg, price_per_kg, total_value, reference_type, reference_id, movement_date)
    VALUES (${orgId}, ${plateST[0].id}, 'in', '500.000', '110.00', '55000.00', 'purchase', ${p1.id}, ${lastWeek})
  `;
  const [pp1] = await sql`
    INSERT INTO purchase_payments (organization_id, purchase_id, amount, account_id, payment_date)
    VALUES (${orgId}, ${p1.id}, '55000', ${cashAcc.id}, ${lastWeek}) RETURNING id
  `;
  await sql`
    INSERT INTO account_transactions (organization_id, account_id, type, amount, reference_type, reference_id, transaction_date)
    VALUES (${orgId}, ${cashAcc.id}, 'debit', '55000', 'purchase_payment', ${pp1.id}, ${lastWeek})
  `;
  console.log("✓ Purchase 1 created (paid)");

  // ── 7. Purchase 2 (partial) ──
  const [p2] = await sql`
    INSERT INTO purchases (organization_id, vendor_id, purchase_date, total_amount, paid_amount, status)
    VALUES (${orgId}, ${v2.id}, ${threeDaysAgo}, '28500', '10000', 'partial')
    RETURNING id
  `;
  await sql`
    INSERT INTO purchase_items (organization_id, purchase_id, subtype_id, quantity_kg, price_per_kg)
    VALUES (${orgId}, ${p2.id}, ${plateST[1].id}, '300.000', '95.00')
  `;
  await sql`
    INSERT INTO stock_ledger (organization_id, subtype_id, movement_type, quantity_kg, price_per_kg, total_value, reference_type, reference_id, movement_date)
    VALUES (${orgId}, ${plateST[1].id}, 'in', '300.000', '95.00', '28500.00', 'purchase', ${p2.id}, ${threeDaysAgo})
  `;
  const [pp2] = await sql`
    INSERT INTO purchase_payments (organization_id, purchase_id, amount, account_id, payment_date)
    VALUES (${orgId}, ${p2.id}, '10000', ${bankAcc.id}, ${threeDaysAgo}) RETURNING id
  `;
  await sql`
    INSERT INTO account_transactions (organization_id, account_id, type, amount, reference_type, reference_id, transaction_date)
    VALUES (${orgId}, ${bankAcc.id}, 'debit', '10000', 'purchase_payment', ${pp2.id}, ${threeDaysAgo})
  `;
  console.log("✓ Purchase 2 created (partial)");

  // ── 8. Sale 1 (fabricated, paid) ──
  const [s1] = await sql`
    INSERT INTO sales (organization_id, customer_id, sale_type, is_quick_cash_sale, sale_date, total_amount, paid_amount, status, note)
    VALUES (${orgId}, ${c1.id}, 'fabricated', false, ${twoDaysAgo}, '26000', '26000', 'paid', 'Fabricated order - 200kg plates')
    RETURNING id
  `;
  await sql`
    INSERT INTO sale_items (organization_id, sale_id, subtype_id, quantity_kg, price_per_kg)
    VALUES (${orgId}, ${s1.id}, ${plateST[0].id}, '200.000', '130.00')
  `;
  await sql`
    INSERT INTO stock_ledger (organization_id, subtype_id, movement_type, quantity_kg, price_per_kg, total_value, reference_type, reference_id, movement_date)
    VALUES (${orgId}, ${plateST[0].id}, 'out', '200.000', '110.00', '22000.00', 'sale_fabricated', ${s1.id}, ${twoDaysAgo})
  `;
  const [sp1] = await sql`
    INSERT INTO sale_payments (organization_id, sale_id, amount, account_id, payment_date)
    VALUES (${orgId}, ${s1.id}, '26000', ${cashAcc.id}, ${twoDaysAgo}) RETURNING id
  `;
  await sql`
    INSERT INTO account_transactions (organization_id, account_id, type, amount, reference_type, reference_id, transaction_date)
    VALUES (${orgId}, ${cashAcc.id}, 'credit', '26000', 'sale_payment', ${sp1.id}, ${twoDaysAgo})
  `;
  console.log("✓ Sale 1 created (fabricated, paid)");

  // ── 9. Sale 2 (raw passthrough, partial) ──
  const [s2] = await sql`
    INSERT INTO sales (organization_id, customer_id, sale_type, is_quick_cash_sale, sale_date, total_amount, paid_amount, status)
    VALUES (${orgId}, ${c2.id}, 'raw_passthrough', false, ${yesterday}, '11000', '5000', 'partial')
    RETURNING id
  `;
  await sql`
    INSERT INTO sale_items (organization_id, sale_id, subtype_id, quantity_kg, price_per_kg)
    VALUES (${orgId}, ${s2.id}, ${plateST[1].id}, '100.000', '110.00')
  `;
  await sql`
    INSERT INTO stock_ledger (organization_id, subtype_id, movement_type, quantity_kg, price_per_kg, total_value, reference_type, reference_id, movement_date)
    VALUES (${orgId}, ${plateST[1].id}, 'out', '100.000', '95.00', '9500.00', 'sale_raw', ${s2.id}, ${yesterday})
  `;
  const [sp2] = await sql`
    INSERT INTO sale_payments (organization_id, sale_id, amount, account_id, payment_date)
    VALUES (${orgId}, ${s2.id}, '5000', ${cashAcc.id}, ${yesterday}) RETURNING id
  `;
  await sql`
    INSERT INTO account_transactions (organization_id, account_id, type, amount, reference_type, reference_id, transaction_date)
    VALUES (${orgId}, ${cashAcc.id}, 'credit', '5000', 'sale_payment', ${sp2.id}, ${yesterday})
  `;
  console.log("✓ Sale 2 created (raw passthrough, partial)");

  // ── 10. Quick cash sale ──
  const [s3] = await sql`
    INSERT INTO sales (organization_id, sale_type, is_quick_cash_sale, sale_date, total_amount, paid_amount, status, note)
    VALUES (${orgId}, 'raw_passthrough', true, ${today}, '6000', '6000', 'paid', 'Quick cash - walk-in customer')
    RETURNING id
  `;
  await sql`
    INSERT INTO sale_items (organization_id, sale_id, subtype_id, quantity_kg, price_per_kg)
    VALUES (${orgId}, ${s3.id}, ${angleST.id}, '50.000', '120.00')
  `;
  const [sp3] = await sql`
    INSERT INTO sale_payments (organization_id, sale_id, amount, account_id, payment_date)
    VALUES (${orgId}, ${s3.id}, '6000', ${cashAcc.id}, ${today}) RETURNING id
  `;
  await sql`
    INSERT INTO account_transactions (organization_id, account_id, type, amount, reference_type, reference_id, transaction_date)
    VALUES (${orgId}, ${cashAcc.id}, 'credit', '6000', 'sale_payment', ${sp3.id}, ${today})
  `;
  console.log("✓ Sale 3 created (quick cash)");

  // ── Scrap pool ──
  await sql`
    INSERT INTO scrap_pool (organization_id, movement_type, quantity_kg, reference_id, movement_date, note)
    VALUES (${orgId}, 'in', '150.000', ${s1.id}, ${twoDaysAgo}, 'Scrap from fabrication order')
  `;
  console.log("✓ Scrap pool seeded");

  console.log("\n✅ Seed complete!");
  console.log(`Org: ${orgId}`);
  console.log(`Accounts: Cash, Dutch Bangla Bank`);
  console.log(`Categories: Iron Plates, Angle Iron`);
  console.log(`Subtypes: 5-8mm, 9-11mm, 12-13mm, 2 inch`);
  console.log(`Vendors: Bashundhara Steel, Rahim Shipyard`);
  console.log(`Customers: Akbar Traders, Kamal Fabrication`);
  console.log(`Purchases: 2 (1 paid, 1 partial)`);
  console.log(`Sales: 3 (fabricated+paid, raw+partial, quick cash)`);

  await sql.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
