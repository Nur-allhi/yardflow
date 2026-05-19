import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  customers,
  saleItems,
  materialSubtypes,
  salePayments,
  accounts,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sale] = await db
    .select({
      id: sales.id,
      customer_id: sales.customer_id,
      sale_type: sales.sale_type,
      is_quick_cash_sale: sales.is_quick_cash_sale,
      sale_date: sales.sale_date,
      total_amount: sales.total_amount,
      paid_amount: sales.paid_amount,
      due_amount: sales.due_amount,
      status: sales.status,
      note: sales.note,
      created_at: sales.created_at,
      customer_name: customers.name,
      customer_phone: customers.phone,
    })
    .from(sales)
    .leftJoin(
      customers,
      and(
        eq(sales.customer_id, customers.id),
        sql`${customers.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        eq(sales.id, id),
        eq(sales.organization_id, orgId),
        sql`${sales.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: saleItems.id,
      subtype_id: saleItems.subtype_id,
      quantity_kg: saleItems.quantity_kg,
      price_per_kg: saleItems.price_per_kg,
      total_amount: saleItems.total_amount,
      subtype_name: materialSubtypes.name,
    })
    .from(saleItems)
    .leftJoin(
      materialSubtypes,
      eq(saleItems.subtype_id, materialSubtypes.id),
    )
    .where(
      and(
        eq(saleItems.sale_id, id),
        eq(saleItems.organization_id, orgId),
        sql`${saleItems.deleted_at} IS NULL`,
      ),
    );

  const payments = await db
    .select({
      id: salePayments.id,
      amount: salePayments.amount,
      payment_date: salePayments.payment_date,
      note: salePayments.note,
      account_id: salePayments.account_id,
      account_name: accounts.name,
    })
    .from(salePayments)
    .leftJoin(
      accounts,
      and(
        eq(salePayments.account_id, accounts.id),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .where(
      and(
        eq(salePayments.sale_id, id),
        eq(salePayments.organization_id, orgId),
        sql`${salePayments.deleted_at} IS NULL`,
      ),
    )
    .orderBy(salePayments.payment_date);

  return NextResponse.json({
    ...sale,
    total_amount: Number(sale.total_amount),
    paid_amount: Number(sale.paid_amount),
    due_amount: Number(sale.due_amount),
    customer: sale.customer_id
      ? { name: sale.customer_name, phone: sale.customer_phone }
      : null,
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
