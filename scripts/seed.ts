import { db } from "../src/lib/db";
import {
  users,
  accounts,
  materialCategories,
  materialSubtypes,
  vendors,
  customers,
  purchases,
  purchaseItems,
  stockLedger,
  purchasePayments,
  accountTransactions,
  sales,
  saleItems,
  salePayments,
  scrapPool,
} from "../src/lib/db/schema";

async function seed() {
  const [user] = await db
    .select()
    .from(users)
    .limit(1);

  if (!user) {
    console.error("No user found. Register first.");
    process.exit(1);
  }

  const orgId = user.organization_id;

  // ── 1. Accounts ──
  const [cashAcc] = await db.insert(accounts).values({
    organization_id: orgId,
    name: "Cash",
    type: "cash",
    is_active: true,
  }).returning();

  const [bankAcc] = await db.insert(accounts).values({
    organization_id: orgId,
    name: "Dutch Bangla Bank",
    type: "bank",
    bank_name: "Dutch Bangla Bank Ltd.",
    account_number: "DBBL-1234-5678",
    is_active: true,
  }).returning();

  console.log("Accounts created:", cashAcc.name, bankAcc.name);

  // ── 2. Categories & Subtypes ──
  const [catPlates] = await db.insert(materialCategories).values({
    organization_id: orgId,
    name: "Iron Plates",
  }).returning();

  const [catAngle] = await db.insert(materialCategories).values({
    organization_id: orgId,
    name: "Angle Iron",
  }).returning();

  const plateSubtypesData = [
    { name: "5-8mm", price: 110 },
    { name: "9-11mm", price: 95 },
    { name: "12-13mm", price: 92 },
    { name: "14-20mm", price: 87 },
    { name: "25mm", price: 90 },
  ];

  const plateSubtypes: { id: string; name: string }[] = [];
  for (const st of plateSubtypesData) {
    const [created] = await db.insert(materialSubtypes).values({
      organization_id: orgId,
      category_id: catPlates.id,
      name: st.name,
    }).returning();
    plateSubtypes.push(created);
  }

  const angleSubtypesData = [
    { name: "2 inch", price: 95 },
    { name: "3 inch", price: 100 },
    { name: "4 inch", price: 108 },
  ];

  const angleSubtypes: { id: string; name: string }[] = [];
  for (const st of angleSubtypesData) {
    const [created] = await db.insert(materialSubtypes).values({
      organization_id: orgId,
      category_id: catAngle.id,
      name: st.name,
    }).returning();
    angleSubtypes.push(created);
  }

  console.log("Categories + Subtypes created");

  // ── 3. Vendors ──
  const [v1] = await db.insert(vendors).values({
    organization_id: orgId,
    name: "Bashundhara Steel",
    phone: "01711-111111",
    address: "Kawran Bazar, Dhaka",
    type: "shipyard",
    opening_balance: "0",
  }).returning();

  const [v2] = await db.insert(vendors).values({
    organization_id: orgId,
    name: "Rahim Shipyard",
    phone: "01711-222222",
    address: "Sitakunda, Chattogram",
    type: "shipyard",
    opening_balance: "50000",
  }).returning();

  console.log("Vendors created");

  // ── 4. Customers ──
  const [c1] = await db.insert(customers).values({
    organization_id: orgId,
    name: "Akbar Traders",
    phone: "01811-333333",
    address: "Chawk Bazar, Dhaka",
    type: "regular",
    opening_balance: "0",
  }).returning();

  const [c2] = await db.insert(customers).values({
    organization_id: orgId,
    name: "Kamal Fabrication",
    phone: "01811-444444",
    address: "Tejgaon, Dhaka",
    type: "regular",
    opening_balance: "25000",
  }).returning();

  console.log("Customers created");

  // ── 5. Purchase 1: 500kg 5-8mm plates @ 110 ──
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [p1] = await db.insert(purchases).values({
    organization_id: orgId,
    vendor_id: v1.id,
    purchase_date: lastWeek,
    total_amount: "55000",
    paid_amount: "55000",
    status: "paid",
    note: "First purchase from Bashundhara",
  }).returning();

  await db.insert(purchaseItems).values({
    organization_id: orgId,
    purchase_id: p1.id,
    subtype_id: plateSubtypes[0].id,
    quantity_kg: "500.000",
    price_per_kg: "110.00",
  });

  await db.insert(stockLedger).values({
    organization_id: orgId,
    subtype_id: plateSubtypes[0].id,
    movement_type: "in",
    quantity_kg: "500.000",
    price_per_kg: "110.00",
    total_value: "55000.00",
    reference_type: "purchase",
    reference_id: p1.id,
    movement_date: lastWeek,
  });

  // Record payment
  const [pp1] = await db.insert(purchasePayments).values({
    organization_id: orgId,
    purchase_id: p1.id,
    amount: "55000.00",
    account_id: cashAcc.id,
    payment_date: lastWeek,
  }).returning();

  await db.insert(accountTransactions).values({
    organization_id: orgId,
    account_id: cashAcc.id,
    type: "debit",
    amount: "55000.00",
    reference_type: "purchase_payment",
    reference_id: pp1.id,
    transaction_date: lastWeek,
  });

  console.log("Purchase 1 created (paid)");

  // ── 6. Purchase 2: 300kg 9-11mm @ 95 (due) ──
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [p2] = await db.insert(purchases).values({
    organization_id: orgId,
    vendor_id: v2.id,
    purchase_date: threeDaysAgo,
    total_amount: "28500",
    paid_amount: "10000",
    status: "partial",
    note: null,
  }).returning();

  await db.insert(purchaseItems).values({
    organization_id: orgId,
    purchase_id: p2.id,
    subtype_id: plateSubtypes[1].id,
    quantity_kg: "300.000",
    price_per_kg: "95.00",
  });

  await db.insert(stockLedger).values({
    organization_id: orgId,
    subtype_id: plateSubtypes[1].id,
    movement_type: "in",
    quantity_kg: "300.000",
    price_per_kg: "95.00",
    total_value: "28500.00",
    reference_type: "purchase",
    reference_id: p2.id,
    movement_date: threeDaysAgo,
  });

  const [pp2] = await db.insert(purchasePayments).values({
    organization_id: orgId,
    purchase_id: p2.id,
    amount: "10000.00",
    account_id: bankAcc.id,
    payment_date: threeDaysAgo,
  }).returning();

  await db.insert(accountTransactions).values({
    organization_id: orgId,
    account_id: bankAcc.id,
    type: "debit",
    amount: "10000.00",
    reference_type: "purchase_payment",
    reference_id: pp2.id,
    transaction_date: threeDaysAgo,
  });

  console.log("Purchase 2 created (partial)");

  // ── 7. Sale 1: Fabricated - 200kg 5-8mm @ 130/kg to Akbar ──
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const [s1] = await db.insert(sales).values({
    organization_id: orgId,
    customer_id: c1.id,
    sale_type: "fabricated",
    is_quick_cash_sale: false,
    sale_date: twoDaysAgo,
    total_amount: "26000",
    paid_amount: "26000",
    status: "paid",
    note: "Fabricated order - 200kg plates",
  }).returning();

  await db.insert(saleItems).values({
    organization_id: orgId,
    sale_id: s1.id,
    subtype_id: plateSubtypes[0].id,
    quantity_kg: "200.000",
    price_per_kg: "130.00",
  });

  await db.insert(stockLedger).values({
    organization_id: orgId,
    subtype_id: plateSubtypes[0].id,
    movement_type: "out",
    quantity_kg: "200.000",
    price_per_kg: "110.00",
    total_value: "22000.00",
    reference_type: "sale_fabricated",
    reference_id: s1.id,
    movement_date: twoDaysAgo,
  });

  const [sp1] = await db.insert(salePayments).values({
    organization_id: orgId,
    sale_id: s1.id,
    amount: "26000.00",
    account_id: cashAcc.id,
    payment_date: twoDaysAgo,
  }).returning();

  await db.insert(accountTransactions).values({
    organization_id: orgId,
    account_id: cashAcc.id,
    type: "credit",
    amount: "26000.00",
    reference_type: "sale_payment",
    reference_id: sp1.id,
    transaction_date: twoDaysAgo,
  });

  console.log("Sale 1 created (fabricated, paid)");

  // ── 8. Sale 2: Raw passthrough - 100kg 9-11mm @ 110/kg to Kamal (partial) ──
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [s2] = await db.insert(sales).values({
    organization_id: orgId,
    customer_id: c2.id,
    sale_type: "raw_passthrough",
    is_quick_cash_sale: false,
    sale_date: yesterday,
    total_amount: "11000",
    paid_amount: "5000",
    status: "partial",
    note: null,
  }).returning();

  await db.insert(saleItems).values({
    organization_id: orgId,
    sale_id: s2.id,
    subtype_id: plateSubtypes[1].id,
    quantity_kg: "100.000",
    price_per_kg: "110.00",
  });

  await db.insert(stockLedger).values({
    organization_id: orgId,
    subtype_id: plateSubtypes[1].id,
    movement_type: "out",
    quantity_kg: "100.000",
    price_per_kg: "95.00",
    total_value: "9500.00",
    reference_type: "sale_raw",
    reference_id: s2.id,
    movement_date: yesterday,
  });

  const [sp2] = await db.insert(salePayments).values({
    organization_id: orgId,
    sale_id: s2.id,
    amount: "5000.00",
    account_id: cashAcc.id,
    payment_date: yesterday,
  }).returning();

  await db.insert(accountTransactions).values({
    organization_id: orgId,
    account_id: cashAcc.id,
    type: "credit",
    amount: "5000.00",
    reference_type: "sale_payment",
    reference_id: sp2.id,
    transaction_date: yesterday,
  });

  console.log("Sale 2 created (raw passthrough, partial)");

  // ── 9. Sale 3: Quick cash sale - 50kg angle iron @ 120/kg ──
  const [s3] = await db.insert(sales).values({
    organization_id: orgId,
    customer_id: null,
    sale_type: "raw_passthrough",
    is_quick_cash_sale: true,
    sale_date: today,
    total_amount: "6000",
    paid_amount: "6000",
    status: "paid",
    note: "Quick cash - walk-in customer",
  }).returning();

  await db.insert(saleItems).values({
    organization_id: orgId,
    sale_id: s3.id,
    subtype_id: angleSubtypes[0].id,
    quantity_kg: "50.000",
    price_per_kg: "120.00",
  });

  const [sp3] = await db.insert(salePayments).values({
    organization_id: orgId,
    sale_id: s3.id,
    amount: "6000.00",
    account_id: cashAcc.id,
    payment_date: today,
  }).returning();

  await db.insert(accountTransactions).values({
    organization_id: orgId,
    account_id: cashAcc.id,
    type: "credit",
    amount: "6000.00",
    reference_type: "sale_payment",
    reference_id: sp3.id,
    transaction_date: today,
  });

  console.log("Sale 3 created (quick cash)");

  // ── 10. Scrap pool - add some scrap from previous processing ──
  await db.insert(scrapPool).values({
    organization_id: orgId,
    movement_type: "in",
    quantity_kg: "150.000",
    reference_id: s1.id,
    movement_date: twoDaysAgo,
    note: "Scrap from fabrication order",
  });

  console.log("Scrap pool seeded");

  console.log("\n✅ Seed complete!");
  console.log(`Org ID: ${orgId}`);
  console.log(`Accounts: ${cashAcc.name}, ${bankAcc.name}`);
  console.log(`Categories: ${catPlates.name}, ${catAngle.name}`);
  console.log(`Subtypes: ${plateSubtypes.length + angleSubtypes.length}`);
  console.log(`Vendors: ${v1.name}, ${v2.name}`);
  console.log(`Customers: ${c1.name}, ${c2.name}`);
  console.log(`Purchases: 2 (1 paid, 1 partial)`);
  console.log(`Sales: 3 (1 fabricated paid, 1 raw partial, 1 quick cash)`);
  console.log(`Scrap pool: 150 kg`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
