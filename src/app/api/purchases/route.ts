import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  purchases,
  vendors,
  purchaseItems,
  stockLedger,
  purchaseOtherExpenses,
} from "@/lib/db/schema";
import {
  eq,
  and,
  sql,
  gte,
  lte,
} from "drizzle-orm";
import { purchaseSchema } from "@/lib/validations/schemas";
import { calculateWAC } from "@/lib/calculations/wac";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";

export async function GET(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendor_id");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const search = searchParams.get("search");

  const conditions = [
    eq(purchases.organization_id, orgId),
    sql`${purchases.deleted_at} IS NULL`,
  ] as (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof sql> | undefined)[];

  if (vendorId) conditions.push(eq(purchases.vendor_id, vendorId));
  if (status) conditions.push(eq(purchases.status, status as "paid" | "partial" | "due"));
  if (dateFrom) conditions.push(gte(purchases.purchase_date, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(purchases.purchase_date, new Date(dateTo)));

  const purchaseList = await db
    .select({
      id: purchases.id,
      vendor_id: purchases.vendor_id,
      purchase_date: purchases.purchase_date,
      total_amount: purchases.total_amount,
      paid_amount: purchases.paid_amount,
      due_amount: purchases.due_amount,
      status: purchases.status,
      note: purchases.note,
      created_at: purchases.created_at,
      vendor_name: vendors.name,
    })
    .from(purchases)
    .leftJoin(
      vendors,
      and(
        eq(purchases.vendor_id, vendors.id),
        sql`${vendors.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        ...conditions,
        search
          ? sql`${vendors.name} ILIKE ${"%" + search + "%"}`
          : undefined,
      ),
    )
    .orderBy(sql`${purchases.purchase_date} DESC`);

  const openingEntries: Array<{
    id: string;
    vendor_id: string;
    purchase_date: null;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: string;
    note: null;
    created_at: null;
    vendor_name: string | null;
  }> = [];

  if (status === "due") {
    const openingConditions: (ReturnType<typeof eq> | ReturnType<typeof sql>)[] = [
      eq(vendors.organization_id, orgId),
      sql`${vendors.deleted_at} IS NULL`,
      sql`${vendors.opening_balance}::numeric > 0`,
      sql`NOT EXISTS (SELECT 1 FROM ${purchases} WHERE ${purchases.vendor_id} = ${vendors.id} AND ${purchases.organization_id} = ${orgId} AND ${purchases.deleted_at} IS NULL AND ${purchases.status} = 'due')`,
    ];
    if (vendorId) openingConditions.push(eq(vendors.id, vendorId));
    if (search) openingConditions.push(sql`${vendors.name} ILIKE ${"%" + search + "%"}`);

    const openingVendors = await db
      .select({
        id: vendors.id,
        name: vendors.name,
        opening_balance: sql<string>`${vendors.opening_balance}::numeric`,
      })
      .from(vendors)
      .where(and(...openingConditions));

    for (const v of openingVendors) {
      openingEntries.push({
        id: `ob-${v.id}`,
        vendor_id: v.id,
        purchase_date: null,
        total_amount: Number(v.opening_balance),
        paid_amount: 0,
        due_amount: Number(v.opening_balance),
        status: "due",
        note: null,
        created_at: null,
        vendor_name: v.name,
      });
    }
  }

  const now = new Date();
  const firstOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const summaryResult = await db
    .select({
      total_purchases: sql<number>`COUNT(*)::int`,
      total_paid: sql<string>`COALESCE(SUM((${purchases.paid_amount})::numeric), 0)`,
      total_amount: sql<string>`COALESCE(SUM((${purchases.total_amount})::numeric), 0)`,
      this_month: sql<string>`COALESCE(SUM((${purchases.total_amount})::numeric) FILTER (WHERE ${purchases.purchase_date} >= ${firstOfMonthStr}), 0)`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.organization_id, orgId),
        sql`${purchases.deleted_at} IS NULL`,
      ),
    );

  const vendorOpeningConditions: (ReturnType<typeof eq> | ReturnType<typeof sql>)[] = [
    eq(vendors.organization_id, orgId),
    sql`${vendors.deleted_at} IS NULL`,
  ];
  if (vendorId) vendorOpeningConditions.push(eq(vendors.id, vendorId));

  const [openingResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${vendors.opening_balance}::numeric), 0)`,
    })
    .from(vendors)
    .where(and(...vendorOpeningConditions));

  const summary = summaryResult[0];
  const totalAmount = Number(summary.total_amount);
  const totalPaid = Number(summary.total_paid);
  const openingBalanceTotal = Number(openingResult.total);

  return NextResponse.json({
    purchases: [
      ...purchaseList.map((p) => ({
        ...p,
        total_amount: Number(p.total_amount),
        paid_amount: Number(p.paid_amount),
        due_amount: Number(p.due_amount),
      })),
      ...openingEntries,
    ],
    summary: {
      total_purchases: summary.total_purchases,
      total_paid: totalPaid,
      total_due: totalAmount - totalPaid + openingBalanceTotal,
      this_month: Number(summary.this_month),
    },
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const itemsTotal = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );

    const otherExpenses = parsed.data.other_expenses ?? [];
    const vendorTotalAdditions = otherExpenses
      .filter((e) => e.add_to_vendor_total)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalAmount = itemsTotal + vendorTotalAdditions;

    const result = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .insert(purchases)
        .values({
          organization_id: orgId,
          vendor_id: parsed.data.vendor_id,
          purchase_date: new Date(parsed.data.purchase_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: "0",
          status: "due",
          note: parsed.data.note || null,
        })
        .returning();

      for (const item of parsed.data.items) {
        const itemTotal = item.quantity_kg * item.price_per_kg;

        await tx.insert(purchaseItems).values({
          organization_id: orgId,
          purchase_id: purchase.id,
          subtype_id: item.subtype_id,
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
        });

        await tx.insert(stockLedger).values({
          organization_id: orgId,
          subtype_id: item.subtype_id,
          movement_type: "in",
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
          total_value: itemTotal.toFixed(2),
          reference_type: "purchase",
          reference_id: purchase.id,
          movement_date: new Date(parsed.data.purchase_date),
        });
      }

      for (const expense of otherExpenses) {
        await tx.insert(purchaseOtherExpenses).values({
          organization_id: orgId,
          purchase_id: purchase.id,
          description: expense.description,
          amount: expense.amount.toFixed(2),
          account_id: expense.account_id || null,
          add_to_vendor_total: expense.add_to_vendor_total,
        });

        if (!expense.add_to_vendor_total && expense.account_id) {
          await recordAccountTransaction({
            organization_id: orgId,
            account_id: expense.account_id,
            type: "debit",
            amount: expense.amount.toFixed(2),
            reference_type: "other",
            reference_id: purchase.id,
            transaction_date: new Date(parsed.data.purchase_date),
            note: `Other expense: ${expense.description}`,
          });
        }
      }

      return purchase;
    });

    const uniqueSubtypeIds = [
      ...new Set(parsed.data.items.map((i) => i.subtype_id)),
    ];
    await Promise.all(
      uniqueSubtypeIds.map((sid) => calculateWAC(orgId, sid)),
    );

    const [vendor] = await db
      .select({ name: vendors.name })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, parsed.data.vendor_id),
          sql`${vendors.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "purchase",
      entityId: result.id,
      description: `Created purchase for ${vendor?.name ?? "Unknown"}`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}
