import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  purchases,
  vendors,
  purchaseItems,
  materialSubtypes,
  purchasePayments,
  accounts,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

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
