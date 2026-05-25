import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simplePurchases,
  simplePurchaseItems,
  simplePurchasePayments,
  simplePurchaseOtherExpenses,
  vendors,
  accounts,
  inventoryPool,
  inventoryMovements,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

const updatePurchaseSchema = z.object({
  vendor_id: z.string().uuid(),
  purchase_date: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  note: z.string().nullable().optional(),
  total_amount: z.number().positive().finite(),
  paid_amount: z.number().min(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  const [purchase] = await db
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
      vendor_phone: vendors.phone,
    })
    .from(simplePurchases)
    .leftJoin(
      vendors,
      and(
        eq(simplePurchases.vendor_id, vendors.id),
        sql`${vendors.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        eq(simplePurchases.id, id),
        eq(simplePurchases.organization_id, orgId),
        sql`${simplePurchases.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(simplePurchaseItems)
    .where(
      and(
        eq(simplePurchaseItems.purchase_id, id),
        eq(simplePurchaseItems.organization_id, orgId),
        sql`${simplePurchaseItems.deleted_at} IS NULL`,
      ),
    );

  const payments = await db
    .select({
      id: simplePurchasePayments.id,
      amount: simplePurchasePayments.amount,
      payment_date: simplePurchasePayments.payment_date,
      note: simplePurchasePayments.note,
      account_id: simplePurchasePayments.account_id,
      account_name: accounts.name,
    })
    .from(simplePurchasePayments)
    .leftJoin(
      accounts,
      and(
        eq(simplePurchasePayments.account_id, accounts.id),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        eq(simplePurchasePayments.purchase_id, id),
        eq(simplePurchasePayments.organization_id, orgId),
        sql`${simplePurchasePayments.deleted_at} IS NULL`,
      ),
    )
    .orderBy(simplePurchasePayments.payment_date);

  const otherExpenses = await db
    .select()
    .from(simplePurchaseOtherExpenses)
    .where(
      and(
        eq(simplePurchaseOtherExpenses.purchase_id, id),
        eq(simplePurchaseOtherExpenses.organization_id, orgId),
        sql`${simplePurchaseOtherExpenses.deleted_at} IS NULL`,
      ),
    );

  return NextResponse.json({
    ...purchase,
    total_amount: Number(purchase.total_amount),
    paid_amount: Number(purchase.paid_amount),
    due_amount: Number(purchase.due_amount),
    items: items.map((i) => ({
      ...i,
      quantity_kg: Number(i.quantity_kg),
      price_per_kg: Number(i.price_per_kg),
      total_amount: Number(i.total_amount),
    })),
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    other_expenses: otherExpenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = updatePurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { vendor_id, purchase_date, note, total_amount, paid_amount } =
      parsed.data;
    const status =
      paid_amount >= total_amount
        ? "paid"
        : paid_amount > 0
          ? "partial"
          : "due";

    const [existing] = await db
      .select({ id: simplePurchases.id })
      .from(simplePurchases)
      .where(
        and(
          eq(simplePurchases.id, id),
          eq(simplePurchases.organization_id, orgId),
          sql`${simplePurchases.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 },
      );
    }

    const [updated] = await db
      .update(simplePurchases)
      .set({
        vendor_id,
        purchase_date: new Date(purchase_date),
        total_amount: total_amount.toFixed(2),
        paid_amount: paid_amount.toFixed(2),
        status,
        note: note ?? null,
        updated_at: sql`NOW()`,
      })
      .where(
        and(
          eq(simplePurchases.id, id),
          eq(simplePurchases.organization_id, orgId),
        ),
      )
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "update",
      entityType: "simple_purchase",
      entityId: id,
      description: "Updated purchase header",
    });

    return NextResponse.json({
      ...updated,
      total_amount: Number(updated.total_amount),
      paid_amount: Number(updated.paid_amount),
      due_amount: Number(updated.due_amount),
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Failed to update purchase" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: simplePurchases.id })
        .from(simplePurchases)
        .where(
          and(
            eq(simplePurchases.id, id),
            eq(simplePurchases.organization_id, orgId),
            sql`${simplePurchases.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Purchase not found");
      }

      const oldItems = await tx
        .select()
        .from(simplePurchaseItems)
        .where(
          and(
            eq(simplePurchaseItems.purchase_id, id),
            eq(simplePurchaseItems.organization_id, orgId),
            sql`${simplePurchaseItems.deleted_at} IS NULL`,
          ),
        );

      const totalQty = oldItems.reduce(
        (sum, i) => sum + Number(i.quantity_kg),
        0,
      );
      const totalVal = oldItems.reduce(
        (sum, i) => sum + Number(i.quantity_kg) * Number(i.price_per_kg),
        0,
      );

      const [current] = await tx
        .select()
        .from(inventoryPool)
        .where(eq(inventoryPool.organization_id, orgId))
        .limit(1);

      const currentQty = current ? Number(current.total_quantity_kg) : 0;
      const currentValue = current ? Number(current.total_value) : 0;
      const newQty = Math.max(0, currentQty - totalQty);
      const newValue = Math.max(0, currentValue - totalVal);

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

      await tx
        .delete(inventoryMovements)
        .where(
          and(
            eq(inventoryMovements.reference_id, id),
            eq(inventoryMovements.reference_type, "purchase"),
            eq(inventoryMovements.organization_id, orgId),
          ),
        );

      await tx
        .update(simplePurchaseItems)
        .set({ deleted_at: new Date() })
        .where(
          and(
            eq(simplePurchaseItems.purchase_id, id),
            eq(simplePurchaseItems.organization_id, orgId),
            sql`${simplePurchaseItems.deleted_at} IS NULL`,
          ),
        );

      await tx
        .update(simplePurchasePayments)
        .set({ deleted_at: new Date() })
        .where(
          and(
            eq(simplePurchasePayments.purchase_id, id),
            eq(simplePurchasePayments.organization_id, orgId),
            sql`${simplePurchasePayments.deleted_at} IS NULL`,
          ),
        );

      await tx
        .update(simplePurchases)
        .set({ deleted_at: new Date(), updated_at: sql`NOW()` })
        .where(
          and(
            eq(simplePurchases.id, id),
            eq(simplePurchases.organization_id, orgId),
          ),
        );
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "delete",
      entityType: "simple_purchase",
      entityId: id,
      description: "Deleted purchase",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete purchase";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
