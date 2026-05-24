import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simplePurchases,
  simplePurchaseItems,
  simplePurchaseOtherExpenses,
  vendors,
  inventoryPool,
  inventoryMovements,
} from "@/lib/db/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { recordAccountTransaction } from "@/lib/accounts";

const otherExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive().finite(),
  account_id: z.string().uuid().nullable().optional(),
  add_to_vendor_total: z.boolean().optional(),
});

const createPurchaseSchema = z.object({
  vendor_id: z.string().uuid(),
  purchase_date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity_kg: z.number().positive().finite(),
        price_per_kg: z.number().positive().finite(),
      }),
    )
    .min(1),
  paid_amount: z.number().min(0).optional(),
  account_id: z.string().uuid().optional(),
  note: z.string().optional(),
  other_expenses: z.array(otherExpenseSchema).optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const vendorId = searchParams.get("vendor_id");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const conditions: (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof sql>)[] = [
    eq(simplePurchases.organization_id, orgId),
    sql`${simplePurchases.deleted_at} IS NULL`,
  ];

  if (vendorId) conditions.push(eq(simplePurchases.vendor_id, vendorId));
  if (status) conditions.push(eq(simplePurchases.status, status as "paid" | "partial" | "due"));
  if (dateFrom) conditions.push(gte(simplePurchases.purchase_date, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(simplePurchases.purchase_date, new Date(dateTo)));

  const offset = (page - 1) * limit;

  const [purchaseList, countResult] = await Promise.all([
    db
      .select({
        id: simplePurchases.id,
        vendor_id: simplePurchases.vendor_id,
        purchase_date: simplePurchases.purchase_date,
        total_amount: simplePurchases.total_amount,
        paid_amount: simplePurchases.paid_amount,
        due_amount: simplePurchases.due_amount,
        status: simplePurchases.status,
        note: simplePurchases.note,
        created_at: simplePurchases.created_at,
        vendor_name: vendors.name,
      })
      .from(simplePurchases)
      .leftJoin(
        vendors,
        and(
          eq(simplePurchases.vendor_id, vendors.id),
          sql`${vendors.deleted_at} IS NULL`,
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(simplePurchases.purchase_date))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(simplePurchases)
      .where(and(...conditions))
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({
    data: purchaseList.map((p) => ({
      ...p,
      total_amount: Number(p.total_amount),
      paid_amount: Number(p.paid_amount),
      due_amount: Number(p.due_amount),
    })),
    pagination: {
      page,
      limit,
      total: countResult,
    },
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = createPurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      vendor_id,
      purchase_date,
      items,
      paid_amount = 0,
      account_id,
      note,
      other_expenses = [],
    } = parsed.data;

    const itemsTotal = items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );
    const vendorExpenseTotal = other_expenses
      .filter((e) => e.add_to_vendor_total)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalAmount = itemsTotal + vendorExpenseTotal;
    const status =
      paid_amount >= totalAmount
        ? "paid"
        : paid_amount > 0
          ? "partial"
          : "due";

    const result = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .insert(simplePurchases)
        .values({
          organization_id: orgId,
          vendor_id,
          purchase_date: new Date(purchase_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: paid_amount.toFixed(2),
          status,
          note: note || null,
        })
        .returning();

      for (const item of items) {
        await tx.insert(simplePurchaseItems).values({
          organization_id: orgId,
          purchase_id: purchase.id,
          description: item.description,
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
        });
      }

      const itemTotal = items.reduce(
        (sum, i) => sum + i.quantity_kg * i.price_per_kg,
        0,
      );
      const totalQty = items.reduce((sum, i) => sum + i.quantity_kg, 0);

      const [current] = await tx
        .select()
        .from(inventoryPool)
        .where(eq(inventoryPool.organization_id, orgId))
        .limit(1);

      const currentQty = current ? Number(current.total_quantity_kg) : 0;
      const currentValue = current ? Number(current.total_value) : 0;
      const newQty = currentQty + totalQty;
      const newValue = currentValue + itemTotal;

      await tx
        .insert(inventoryPool)
        .values({
          organization_id: orgId,
          total_quantity_kg: String(newQty),
          total_value: String(newValue),
        })
        .onConflictDoUpdate({
          target: inventoryPool.organization_id,
          set: {
            total_quantity_kg: String(newQty),
            total_value: String(newValue),
          },
        });

      for (const item of items) {
        const itemTotalVal = item.quantity_kg * item.price_per_kg;
        await tx.insert(inventoryMovements).values({
          organization_id: orgId,
          movement_type: "in",
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
          total_value: itemTotalVal.toFixed(2),
          reference_type: "purchase",
          reference_id: purchase.id,
          description: item.description,
          movement_date: new Date(purchase_date),
        });
      }

      for (const expense of other_expenses) {
        await tx.insert(simplePurchaseOtherExpenses).values({
          organization_id: orgId,
          purchase_id: purchase.id,
          description: expense.description,
          amount: expense.amount.toFixed(2),
          account_id: expense.account_id || null,
          add_to_vendor_total: expense.add_to_vendor_total ?? false,
        });

        if (!expense.add_to_vendor_total && expense.account_id) {
          await recordAccountTransaction({
            organization_id: orgId,
            account_id: expense.account_id,
            type: "debit",
            amount: expense.amount.toFixed(2),
            reference_type: "other",
            reference_id: purchase.id,
            transaction_date: new Date(purchase_date),
            note: `Other expense: ${expense.description}`,
          });
        }
      }

      if (paid_amount > 0 && account_id) {
        await recordAccountTransaction({
          organization_id: orgId,
          account_id,
          type: "debit",
          amount: paid_amount.toFixed(2),
          reference_type: "purchase_payment",
          reference_id: purchase.id,
          note: `Payment for purchase #${purchase.id.slice(0, 8)}`,
          transaction_date: new Date(purchase_date),
        });
      }

      return purchase;
    });

    const [vendor] = await db
      .select({ name: vendors.name })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, vendor_id),
          sql`${vendors.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "simple_purchase",
      entityId: result.id,
      description: `Created purchase from ${vendor?.name ?? "Unknown"}`,
    });

    return NextResponse.json(
      {
        ...result,
        total_amount: Number(result.total_amount),
        paid_amount: Number(result.paid_amount),
        due_amount: Number(result.due_amount),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}
