import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, purchases, purchasePayments, accounts } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(
      and(
        eq(vendors.id, id),
        eq(vendors.organization_id, orgId),
        sql`${vendors.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const purchaseList = await db
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.vendor_id, id),
        eq(purchases.organization_id, orgId),
        sql`${purchases.deleted_at} IS NULL`,
      ),
    )
    .orderBy(sql`${purchases.purchase_date} DESC`);

  const purchaseIds = purchaseList.map((p) => p.id);
  let payments: {
    id: string;
    purchase_id: string;
    amount: string;
    payment_date: Date;
    note: string | null;
    account_id: string;
    account_name: string | null;
  }[] = [];
  if (purchaseIds.length > 0) {
    payments = await db
      .select({
        id: purchasePayments.id,
        purchase_id: purchasePayments.purchase_id,
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
          inArray(purchasePayments.purchase_id, purchaseIds),
          eq(purchasePayments.organization_id, orgId),
          sql`${purchasePayments.deleted_at} IS NULL`,
        ),
      )
      .orderBy(purchasePayments.payment_date);
  }

  const openingBalance = Number(vendor.opening_balance);
  const totalPurchaseAmount = purchaseList.reduce((s, p) => s + Number(p.total_amount), 0);
  const totalPaid = purchaseList.reduce((s, p) => s + Number(p.paid_amount), 0);
  const totalDue = openingBalance + totalPurchaseAmount - totalPaid;

  return NextResponse.json({
    id: vendor.id,
    name: vendor.name,
    phone: vendor.phone,
    address: vendor.address,
    type: vendor.type,
    opening_balance: openingBalance,
    is_active: vendor.is_active,
    purchases: purchaseList.map((p) => ({
      id: p.id,
      purchase_date: p.purchase_date,
      total_amount: Number(p.total_amount),
      paid_amount: Number(p.paid_amount),
      due_amount: Number(p.due_amount),
      status: p.status,
      note: p.note,
    })),
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    summary: {
      total_purchases: purchaseList.length,
      total_purchase_amount: totalPurchaseAmount,
      total_paid: totalPaid,
      total_due: totalDue,
    },
  });
}
