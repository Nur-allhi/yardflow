import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  customers,
  saleItems,
  stockLedger,
  scrapPool,
  salePayments,
  accountTransactions,
  accounts,
} from "@/lib/db/schema";
import {
  eq,
  and,
  sql,
  gte,
  lte,
  desc,
} from "drizzle-orm";
import { saleSchema } from "@/lib/validations/schemas";
import { calculateWAC } from "@/lib/calculations/wac";
import { requireOrg } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const orgId = await requireOrg();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");
    const saleType = searchParams.get("sale_type");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "15", 10)));
    const offset = (page - 1) * limit;

    const conditions: (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof sql>)[] = [
      eq(sales.organization_id, orgId),
      sql`${sales.deleted_at} IS NULL`,
    ];

    if (customerId) conditions.push(eq(sales.customer_id, customerId));
    if (saleType) conditions.push(eq(sales.sale_type, saleType as "fabricated" | "raw_passthrough" | "scrap"));
    if (status) conditions.push(eq(sales.status, status as "paid" | "partial" | "due"));
    if (dateFrom) conditions.push(gte(sales.sale_date, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(sales.sale_date, new Date(dateTo)));

    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${"%" + search + "%"} OR COALESCE(${sales.note}, '') ILIKE ${"%" + search + "%"})`,
      );
    }

    const filterConditions = and(...conditions);

    const weightSubquery = db
      .select({
        sale_id: saleItems.sale_id,
        total_kg: sql<number>`COALESCE(SUM(CAST(${saleItems.quantity_kg} AS numeric)), 0)`.as('total_kg'),
      })
      .from(saleItems)
      .groupBy(saleItems.sale_id)
      .as('weight_sub');

    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sales)
      .leftJoin(
        customers,
        and(
          eq(sales.customer_id, customers.id),
          sql`${customers.deleted_at} IS NULL`,
        ),
      )
      .where(filterConditions);

    const saleList = await db
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
        total_kg: weightSubquery.total_kg,
      })
      .from(sales)
      .leftJoin(
        customers,
        and(
          eq(sales.customer_id, customers.id),
          sql`${customers.deleted_at} IS NULL`,
        ),
      )
      .leftJoin(weightSubquery, eq(sales.id, weightSubquery.sale_id))
      .where(filterConditions)
      .orderBy(desc(sales.sale_date))
      .limit(limit)
      .offset(offset);

    const now = new Date();
    const firstOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const summaryResult = await db
      .select({
        total_sales: sql<number>`COUNT(*)::int`,
        total_paid: sql<string>`COALESCE(SUM((${sales.paid_amount})::numeric), 0)`,
        total_amount: sql<string>`COALESCE(SUM((${sales.total_amount})::numeric), 0)`,
        this_month: sql<string>`COALESCE(SUM((${sales.total_amount})::numeric) FILTER (WHERE ${sales.sale_date} >= ${firstOfMonthStr}), 0)`,
      })
      .from(sales)
      .leftJoin(
        customers,
        and(
          eq(sales.customer_id, customers.id),
          sql`${customers.deleted_at} IS NULL`,
        ),
      )
      .where(filterConditions);

    const customerOpeningConditions: (ReturnType<typeof eq> | ReturnType<typeof sql>)[] = [
      eq(customers.organization_id, orgId),
      sql`${customers.deleted_at} IS NULL`,
    ];
    if (customerId) customerOpeningConditions.push(eq(customers.id, customerId));

    const [openingResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${customers.opening_balance}::numeric), 0)`,
      })
      .from(customers)
      .where(and(...customerOpeningConditions));

    const summary = summaryResult[0];
    const totalAmount = Number(summary.total_amount);
    const totalPaid = Number(summary.total_paid);
    const openingBalanceTotal = Number(openingResult.total);

    return NextResponse.json({
      sales: saleList.map((s) => ({
        ...s,
        total_amount: Number(s.total_amount),
        paid_amount: Number(s.paid_amount),
        due_amount: Number(s.due_amount),
        total_kg: Number(s.total_kg),
        customer_name: s.customer_name || "Cash Sale",
      })),
      summary: {
        total_sales: summary.total_sales,
        total_paid: totalPaid,
        total_due: totalAmount - totalPaid + openingBalanceTotal,
        this_month: Number(summary.this_month),
      },
      total_count: count,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const amountReceived = parsed.data.amount_received ?? 0;
    if (amountReceived > 0 && !parsed.data.account_id) {
      return NextResponse.json(
        { error: "account_id is required when amount_received > 0" },
        { status: 400 },
      );
    }

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );

    const isQuickCash = parsed.data.is_quick_cash_sale ?? false;

    let paidAmount: number;
    let saleStatus: "paid" | "partial" | "due";

    if (isQuickCash) {
      paidAmount = totalAmount;
      saleStatus = "paid";
    } else {
      paidAmount = amountReceived;
      if (amountReceived >= totalAmount) {
        saleStatus = "paid";
      } else if (amountReceived > 0) {
        saleStatus = "partial";
      } else {
        saleStatus = "due";
      }
    }

    const saleType = parsed.data.sale_type;

    let wacMap: Map<string, number> | undefined;
    if (saleType === "fabricated" || saleType === "raw_passthrough") {
      wacMap = new Map();
      for (const item of parsed.data.items) {
        if (!wacMap.has(item.subtype_id)) {
          const wac = await calculateWAC(orgId, item.subtype_id);
          wacMap.set(item.subtype_id, wac);
        }
      }
    }

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          organization_id: orgId,
          customer_id: isQuickCash ? null : (parsed.data.customer_id || null),
          sale_type: saleType,
          is_quick_cash_sale: isQuickCash,
          sale_date: new Date(parsed.data.sale_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: paidAmount.toFixed(2),
          status: saleStatus,
          note: parsed.data.note || null,
        })
        .returning();

      for (const item of parsed.data.items) {
        await tx.insert(saleItems).values({
          organization_id: orgId,
          sale_id: sale.id,
          subtype_id: item.subtype_id,
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
        });

        if (saleType === "scrap") {
          await tx.insert(scrapPool).values({
            organization_id: orgId,
            movement_type: "out",
            quantity_kg: item.quantity_kg.toFixed(3),
            reference_id: sale.id,
            movement_date: new Date(parsed.data.sale_date),
          });
        } else {
          const wac = wacMap?.get(item.subtype_id) ?? 0;
          await tx.insert(stockLedger).values({
            organization_id: orgId,
            subtype_id: item.subtype_id,
            movement_type: "out",
            quantity_kg: item.quantity_kg.toFixed(3),
            price_per_kg: wac.toFixed(2),
            total_value: (item.quantity_kg * wac).toFixed(2),
            reference_type:
              saleType === "fabricated" ? "sale_fabricated" : "sale_raw",
            reference_id: sale.id,
            movement_date: new Date(parsed.data.sale_date),
          });
        }
      }

      if (amountReceived > 0 && parsed.data.account_id) {
        const [payment] = await tx
          .insert(salePayments)
          .values({
            organization_id: orgId,
            sale_id: sale.id,
            amount: amountReceived.toFixed(2),
            account_id: parsed.data.account_id,
            payment_date: new Date(parsed.data.sale_date),
            note: parsed.data.note || null,
          })
          .returning();

        await tx.insert(accountTransactions).values({
          organization_id: orgId,
          account_id: parsed.data.account_id,
          type: "credit",
          amount: amountReceived.toFixed(2),
          reference_type: "sale_payment",
          reference_id: payment.id,
          transaction_date: new Date(parsed.data.sale_date),
          note: parsed.data.note || null,
        });

        await tx.execute(
          sql`UPDATE ${accounts} SET current_balance = (
            SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount::numeric ELSE 0 END), 0) -
                   COALESCE(SUM(CASE WHEN type = 'debit' THEN amount::numeric ELSE 0 END), 0)
            FROM ${accountTransactions}
            WHERE account_id = ${parsed.data.account_id}
            AND deleted_at IS NULL
          ) WHERE id = ${parsed.data.account_id}`
        );
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}
