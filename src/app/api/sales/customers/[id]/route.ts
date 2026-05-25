import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales, salePayments, accounts, simpleSales, simpleSalePayments, accountTransactions } from "@/lib/db/schema";
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

  const [saleList, simpleSaleList] = await Promise.all([
    db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.customer_id, id),
          eq(sales.organization_id, orgId),
          sql`${sales.deleted_at} IS NULL`,
        ),
      )
      .orderBy(sql`${sales.sale_date} DESC`),

    db
      .select()
      .from(simpleSales)
      .where(
        and(
          eq(simpleSales.customer_id, id),
          eq(simpleSales.organization_id, orgId),
          sql`${simpleSales.deleted_at} IS NULL`,
        ),
      )
      .orderBy(sql`${simpleSales.sale_date} DESC`),
  ]);

  const saleIds = saleList.map((s) => s.id);
  const simpleSaleIds = simpleSaleList.map((s) => s.id);

  const [payments, simplePayments, openingBalancePayments] = await Promise.all([
    saleIds.length > 0
      ? db
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
          .orderBy(salePayments.payment_date)
      : Promise.resolve([] as {
          id: string; sale_id: string; amount: string; payment_date: Date;
          note: string | null; account_id: string; account_name: string | null;
        }[]),
    simpleSaleIds.length > 0
      ? db
          .select({
            id: simpleSalePayments.id,
            sale_id: simpleSalePayments.sale_id,
            amount: simpleSalePayments.amount,
            payment_date: simpleSalePayments.payment_date,
            note: simpleSalePayments.note,
            account_id: simpleSalePayments.account_id,
            account_name: accounts.name,
          })
          .from(simpleSalePayments)
          .leftJoin(
            accounts,
            and(
              eq(simpleSalePayments.account_id, accounts.id),
              sql`${accounts.deleted_at} IS NULL`,
            ),
          )
          .where(
            and(
              inArray(simpleSalePayments.sale_id, simpleSaleIds),
              eq(simpleSalePayments.organization_id, orgId),
              sql`${simpleSalePayments.deleted_at} IS NULL`,
            ),
          )
          .orderBy(simpleSalePayments.payment_date)
      : Promise.resolve([] as {
          id: string; sale_id: string; amount: string; payment_date: Date;
          note: string | null; account_id: string; account_name: string | null;
        }[]),
    db
      .select({
        id: accountTransactions.id,
        amount: accountTransactions.amount,
        payment_date: accountTransactions.transaction_date,
        note: accountTransactions.note,
        account_id: accountTransactions.account_id,
        account_name: accounts.name,
      })
      .from(accountTransactions)
      .leftJoin(
        accounts,
        and(
          eq(accountTransactions.account_id, accounts.id),
          sql`${accounts.deleted_at} IS NULL`,
        ),
      )
      .where(
        and(
          eq(accountTransactions.reference_type, "other"),
          eq(accountTransactions.reference_id, id),
          eq(accountTransactions.organization_id, orgId),
          sql`${accountTransactions.deleted_at} IS NULL`,
        ),
      )
      .orderBy(accountTransactions.transaction_date)
      .then((res) =>
        res.map((r) => ({ ...r, sale_id: "opening-balance", amount: Number(r.amount) })),
      ),
  ]);

  const openingBalance = Number(customer.opening_balance);
  const totalSaleAmount =
    saleList.reduce((s, sa) => s + Number(sa.total_amount), 0) +
    simpleSaleList.reduce((s, sa) => s + Number(sa.total_amount), 0);
  const totalReceived =
    saleList.reduce((s, sa) => s + Number(sa.paid_amount), 0) +
    simpleSaleList.reduce((s, sa) => s + Number(sa.paid_amount), 0);
  const totalDue = openingBalance + totalSaleAmount - totalReceived;

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    opening_balance: openingBalance,
    is_active: customer.is_active,
    sales: [
      ...saleList.map((s) => ({
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
      ...simpleSaleList.map((s) => ({
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
    ],
    payments: [
      ...payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      ...simplePayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      ...openingBalancePayments,
    ],
    summary: {
      total_sales: saleList.length + simpleSaleList.length,
      total_sale_amount: totalSaleAmount,
      total_received: totalReceived,
      total_due: totalDue,
    },
  });
}
