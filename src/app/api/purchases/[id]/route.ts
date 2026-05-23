import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  purchases,
  vendors,
  purchaseItems,
  materialSubtypes,
  purchasePayments,
  accounts,
  stockLedger,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { purchaseSchema } from "@/lib/validations/schemas";
import { calculateWAC } from "@/lib/calculations/wac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  const [purchase] = await db
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
      vendor_phone: vendors.phone,
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
        eq(purchases.id, id),
        eq(purchases.organization_id, orgId),
        sql`${purchases.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: purchaseItems.id,
      subtype_id: purchaseItems.subtype_id,
      quantity_kg: purchaseItems.quantity_kg,
      price_per_kg: purchaseItems.price_per_kg,
      total_amount: purchaseItems.total_amount,
      subtype_name: materialSubtypes.name,
    })
    .from(purchaseItems)
    .leftJoin(
      materialSubtypes,
      eq(purchaseItems.subtype_id, materialSubtypes.id),
    )
    .where(
      and(
        eq(purchaseItems.purchase_id, id),
        eq(purchaseItems.organization_id, orgId),
        sql`${purchaseItems.deleted_at} IS NULL`,
      ),
    );

  const payments = await db
    .select({
      id: purchasePayments.id,
      amount: purchasePayments.amount,
      payment_date: purchasePayments.payment_date,
      note: purchasePayments.note,
      account_id: purchasePayments.account_id,
      account_name: accounts.name,
    })
    .from(purchasePayments)
    .leftJoin(
      accounts,
      and(
        eq(purchasePayments.account_id, accounts.id),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        eq(purchasePayments.purchase_id, id),
        eq(purchasePayments.organization_id, orgId),
        sql`${purchasePayments.deleted_at} IS NULL`,
      ),
    )
    .orderBy(purchasePayments.payment_date);

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
      const [existing] = await tx
        .select({ id: purchases.id })
        .from(purchases)
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
            sql`${purchases.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Purchase not found");
      }

      await tx
        .delete(stockLedger)
        .where(
          and(
            eq(stockLedger.reference_type, "purchase"),
            eq(stockLedger.reference_id, id),
            eq(stockLedger.organization_id, orgId),
          ),
        );

      await tx
        .delete(purchaseItems)
        .where(
          and(
            eq(purchaseItems.purchase_id, id),
            eq(purchaseItems.organization_id, orgId),
          ),
        );

      const [updated] = await tx
        .update(purchases)
        .set({
          vendor_id: parsed.data.vendor_id,
          purchase_date: new Date(parsed.data.purchase_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: "0",
          status: "due",
          note: parsed.data.note || null,
          updated_at: sql`NOW()`,
        })
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
          ),
        )
        .returning();

      for (const item of parsed.data.items) {
        const itemTotal = item.quantity_kg * item.price_per_kg;

        await tx.insert(purchaseItems).values({
          organization_id: orgId,
          purchase_id: id,
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
          reference_id: id,
          movement_date: new Date(parsed.data.purchase_date),
        });
      }

      return updated;
    });

    const uniqueSubtypeIds = [
      ...new Set(parsed.data.items.map((i) => i.subtype_id)),
    ];
    await Promise.all(
      uniqueSubtypeIds.map((sid) => calculateWAC(orgId, sid)),
    );

    return NextResponse.json({
      ...result,
      total_amount: Number(result.total_amount),
      paid_amount: Number(result.paid_amount),
      due_amount: Number(result.due_amount),
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update purchase";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
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
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: purchases.id })
        .from(purchases)
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
            sql`${purchases.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Purchase not found");
      }

      const oldItems = await tx
        .select({ subtype_id: purchaseItems.subtype_id })
        .from(purchaseItems)
        .where(
          and(
            eq(purchaseItems.purchase_id, id),
            eq(purchaseItems.organization_id, orgId),
            sql`${purchaseItems.deleted_at} IS NULL`,
          ),
        );

      await tx
        .delete(stockLedger)
        .where(
          and(
            eq(stockLedger.reference_type, "purchase"),
            eq(stockLedger.reference_id, id),
            eq(stockLedger.organization_id, orgId),
          ),
        );

      await tx
        .update(purchaseItems)
        .set({ deleted_at: new Date() })
        .where(
          and(
            eq(purchaseItems.purchase_id, id),
            eq(purchaseItems.organization_id, orgId),
            sql`${purchaseItems.deleted_at} IS NULL`,
          ),
        );

      await tx
        .update(purchasePayments)
        .set({ deleted_at: new Date() })
        .where(
          and(
            eq(purchasePayments.purchase_id, id),
            eq(purchasePayments.organization_id, orgId),
            sql`${purchasePayments.deleted_at} IS NULL`,
          ),
        );

      await tx
        .update(purchases)
        .set({ deleted_at: new Date(), updated_at: sql`NOW()` })
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
          ),
        );

      return oldItems;
    });

    const subtypeIds = [...new Set(result.map((i) => i.subtype_id))];
    await Promise.all(
      subtypeIds.map((sid) => calculateWAC(orgId, sid)),
    );

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "delete",
      entityType: "purchase",
      entityId: id,
      description: "Deleted purchase",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error voiding purchase:", error);
    const message =
      error instanceof Error ? error.message : "Failed to void purchase";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
