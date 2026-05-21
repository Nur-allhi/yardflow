import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  purchases,
  vendors,
  purchaseItems,
  stockLedger,
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
import { requireOrg } from "@/lib/auth/session";

export async function GET(request: Request) {
  const orgId = await requireOrg();

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

  const summary = summaryResult[0];
  const totalAmount = Number(summary.total_amount);
  const totalPaid = Number(summary.total_paid);

  return NextResponse.json({
    purchases: purchaseList.map((p) => ({
      ...p,
      total_amount: Number(p.total_amount),
      paid_amount: Number(p.paid_amount),
      due_amount: Number(p.due_amount),
    })),
    summary: {
      total_purchases: summary.total_purchases,
      total_paid: totalPaid,
      total_due: totalAmount - totalPaid,
      this_month: Number(summary.this_month),
    },
  });
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );

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
          truck_fare: parsed.data.truck_fare ? parsed.data.truck_fare.toFixed(2) : "0",
          labour_cost: parsed.data.labour_cost ? parsed.data.labour_cost.toFixed(2) : "0",
          food_cost: parsed.data.food_cost ? parsed.data.food_cost.toFixed(2) : "0",
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

      return purchase;
    });

    const uniqueSubtypeIds = [
      ...new Set(parsed.data.items.map((i) => i.subtype_id)),
    ];
    await Promise.all(
      uniqueSubtypeIds.map((sid) => calculateWAC(orgId, sid)),
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}
