import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales, salePayments, accounts } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, id),
        eq(customers.organization_id, orgId),
        sql`${customers.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const saleList = await db
    .select()
    .from(sales)
    .where(
      and(
        eq(sales.customer_id, id),
        eq(sales.organization_id, orgId),
        sql`${sales.deleted_at} IS NULL`,
      ),
    )
    .orderBy(sql`${sales.sale_date} DESC`);

  const saleIds = saleList.map((s) => s.id);
  let payments: {
    id: string;
    sale_id: string;
    amount: string;
    payment_date: Date;
    note: string | null;
    account_id: string;
    account_name: string | null;
  }[] = [];
  if (saleIds.length > 0) {
    payments = await db
      .select({
        id: salePayments.id,
        sale_id: salePayments.sale_id,
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
          inArray(salePayments.sale_id, saleIds),
          eq(salePayments.organization_id, orgId),
          sql`${salePayments.deleted_at} IS NULL`,
        ),
      )
      .orderBy(salePayments.payment_date);
  }

  const openingBalance = Number(customer.opening_balance);
  const totalSaleAmount = saleList.reduce((s, sa) => s + Number(sa.total_amount), 0);
  const totalReceived = saleList.reduce((s, sa) => s + Number(sa.paid_amount), 0);
  const totalDue = openingBalance + totalSaleAmount - totalReceived;

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    opening_balance: openingBalance,
    is_active: customer.is_active,
    sales: saleList.map((s) => ({
      id: s.id,
      sale_type: s.sale_type,
      is_quick_cash_sale: s.is_quick_cash_sale,
      sale_date: s.sale_date,
      total_amount: Number(s.total_amount),
      paid_amount: Number(s.paid_amount),
      due_amount: Number(s.due_amount),
      status: s.status,
      note: s.note,
    })),
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    summary: {
      total_sales: saleList.length,
      total_sale_amount: totalSaleAmount,
      total_received: totalReceived,
      total_due: totalDue,
    },
  });
}
