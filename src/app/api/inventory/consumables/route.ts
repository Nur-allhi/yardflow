import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  consumablesLog,
  accounts,
  accountTransactions,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";

const consumablesSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  unit_price: z.number().positive().optional(),
  total_price: z.number().positive("Total price must be positive"),
  vendor_name: z.string().optional(),
  account_id: z.string().uuid("Invalid account"),
  purchase_date: z.string().min(1, "Purchase date is required"),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const [{ count }] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(consumablesLog)
    .where(
      and(
        eq(consumablesLog.organization_id, orgId),
        sql`${consumablesLog.deleted_at} IS NULL`,
      ),
    );

  const entries = await db
    .select({
      id: consumablesLog.id,
      item_name: consumablesLog.item_name,
      quantity: consumablesLog.quantity,
      unit: consumablesLog.unit,
      unit_price: consumablesLog.unit_price,
      total_price: consumablesLog.total_price,
      vendor_name: consumablesLog.vendor_name,
      account_id: consumablesLog.account_id,
      account_name: accounts.name,
      purchase_date: consumablesLog.purchase_date,
      note: consumablesLog.note,
      created_at: consumablesLog.created_at,
    })
    .from(consumablesLog)
    .leftJoin(accounts, eq(consumablesLog.account_id, accounts.id))
    .where(
      and(
        eq(consumablesLog.organization_id, orgId),
        sql`${consumablesLog.deleted_at} IS NULL`,
      ),
    )
    .orderBy(desc(consumablesLog.purchase_date))
    .limit(limit)
    .offset(offset);

  const [summary] = await db
    .select({
      total_spent_this_month:
        sql<string>`COALESCE(SUM(CASE WHEN ${consumablesLog.purchase_date} >= date_trunc('month', now()) THEN ${consumablesLog.total_price} ELSE 0 END), 0)`,
      total_items: sql<number>`COUNT(*)`,
    })
    .from(consumablesLog)
    .where(
      and(
        eq(consumablesLog.organization_id, orgId),
        sql`${consumablesLog.deleted_at} IS NULL`,
      ),
    );

  const [mostUsed] = await db
    .select({
      item_name: consumablesLog.item_name,
      count: sql<number>`COUNT(*)`,
    })
    .from(consumablesLog)
    .where(
      and(
        eq(consumablesLog.organization_id, orgId),
        sql`${consumablesLog.deleted_at} IS NULL`,
      ),
    )
    .groupBy(consumablesLog.item_name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1);

  const totalPages = Math.ceil(count / limit);

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      quantity: e.quantity ? Number(e.quantity) : null,
      unit_price: e.unit_price ? Number(e.unit_price) : null,
      total_price: Number(e.total_price),
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
    },
    summary: {
      total_spent_this_month: Number(summary.total_spent_this_month),
      total_items: summary.total_items,
      most_used_item: mostUsed?.item_name || null,
    },
  });
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = consumablesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const entry = await db.transaction(async (tx) => {
      const [log] = await tx
        .insert(consumablesLog)
        .values({
          organization_id: orgId,
          item_name: parsed.data.item_name,
          quantity: parsed.data.quantity ? String(parsed.data.quantity) : null,
          unit: parsed.data.unit || null,
          unit_price: parsed.data.unit_price
            ? String(parsed.data.unit_price)
            : null,
          total_price: String(parsed.data.total_price),
          vendor_name: parsed.data.vendor_name || null,
          account_id: parsed.data.account_id,
          purchase_date: new Date(parsed.data.purchase_date),
          note: parsed.data.note || null,
        })
        .returning();

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: parsed.data.account_id,
        type: "debit",
        amount: String(parsed.data.total_price),
        reference_type: "other",
        reference_id: log.id,
        note: `Consumable purchase: ${parsed.data.item_name}`,
        transaction_date: new Date(parsed.data.purchase_date),
      });

      return log;
    });

    return NextResponse.json(
      {
        ...entry,
        quantity: entry.quantity ? Number(entry.quantity) : null,
        unit_price: entry.unit_price ? Number(entry.unit_price) : null,
        total_price: Number(entry.total_price),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating consumables entry:", error);
    return NextResponse.json(
      { error: "Failed to create consumables entry" },
      { status: 500 },
    );
  }
}
