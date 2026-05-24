import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales, simpleSales } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { customerSchema } from "@/lib/validations/schemas";
import { requireOrg } from "@/lib/auth/session";

export async function GET(_request: Request) {
  const orgId = await requireOrg();

  const customerList = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      address: customers.address,
      type: customers.type,
      opening_balance: customers.opening_balance,
      is_active: customers.is_active,
      created_at: customers.created_at,
      total_sales: sql<number>`COALESCE(COUNT(${sales.id}) FILTER (WHERE ${sales.deleted_at} IS NULL AND ${sales.organization_id} = ${orgId}), 0)::int`,
      total_paid: sql<string>`COALESCE(SUM((${sales.paid_amount})::numeric) FILTER (WHERE ${sales.deleted_at} IS NULL AND ${sales.organization_id} = ${orgId}), 0)`,
      total_amount: sql<string>`COALESCE(SUM((${sales.total_amount})::numeric) FILTER (WHERE ${sales.deleted_at} IS NULL AND ${sales.organization_id} = ${orgId}), 0)`,
    })
    .from(customers)
    .leftJoin(sales, eq(customers.id, sales.customer_id))
    .where(
      and(
        eq(customers.organization_id, orgId),
        sql`${customers.deleted_at} IS NULL`,
      ),
    )
    .groupBy(customers.id)
    .orderBy(customers.name);

  const simpleAggs = await db
    .select({
      customer_id: simpleSales.customer_id,
      total_sales: sql<number>`COUNT(*)::int`,
      total_paid: sql<string>`COALESCE(SUM((${simpleSales.paid_amount})::numeric), 0)`,
      total_amount: sql<string>`COALESCE(SUM((${simpleSales.total_amount})::numeric), 0)`,
    })
    .from(simpleSales)
    .where(
      and(
        eq(simpleSales.organization_id, orgId),
        sql`${simpleSales.deleted_at} IS NULL`,
      ),
    )
    .groupBy(simpleSales.customer_id);

  const simpleMap = new Map(simpleAggs.map((a) => [a.customer_id, a]));

  const enriched = customerList.map((c) => {
    const s = simpleMap.get(c.id);
    const totalAmount = Number(c.total_amount) + (s ? Number(s.total_amount) : 0);
    const totalPaid = Number(c.total_paid) + (s ? Number(s.total_paid) : 0);
    return {
      ...c,
      opening_balance: Number(c.opening_balance),
      total_purchases: c.total_sales + (s ? s.total_sales : 0),
      total_paid: totalPaid,
      total_amount: totalAmount,
      due_balance: Number(c.opening_balance) + totalAmount - totalPaid,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [customer] = await db
      .insert(customers)
      .values({
        organization_id: orgId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        type: parsed.data.type || "regular",
        opening_balance: parsed.data.opening_balance
          ? String(parsed.data.opening_balance)
          : "0",
      })
      .returning();

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
