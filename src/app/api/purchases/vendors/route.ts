import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, purchases, simplePurchases } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { vendorSchema } from "@/lib/validations/schemas";
import { requireOrg } from "@/lib/auth/session";

export async function GET(_request: Request) {
  const orgId = await requireOrg();

  const vendorList = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      phone: vendors.phone,
      address: vendors.address,
      type: vendors.type,
      opening_balance: vendors.opening_balance,
      is_active: vendors.is_active,
      created_at: vendors.created_at,
      total_purchases: sql<number>`COALESCE(COUNT(${purchases.id}) FILTER (WHERE ${purchases.deleted_at} IS NULL AND ${purchases.organization_id} = ${orgId}), 0)::int`,
      total_paid: sql<string>`COALESCE(SUM((${purchases.paid_amount})::numeric) FILTER (WHERE ${purchases.deleted_at} IS NULL AND ${purchases.organization_id} = ${orgId}), 0)`,
      total_amount: sql<string>`COALESCE(SUM((${purchases.total_amount})::numeric) FILTER (WHERE ${purchases.deleted_at} IS NULL AND ${purchases.organization_id} = ${orgId}), 0)`,
    })
    .from(vendors)
    .leftJoin(purchases, eq(vendors.id, purchases.vendor_id))
    .where(
      and(
        eq(vendors.organization_id, orgId),
        sql`${vendors.deleted_at} IS NULL`,
      ),
    )
    .groupBy(vendors.id)
    .orderBy(vendors.name);

  const simpleAggs = await db
    .select({
      vendor_id: simplePurchases.vendor_id,
      total_purchases: sql<number>`COUNT(*)::int`,
      total_paid: sql<string>`COALESCE(SUM((${simplePurchases.paid_amount})::numeric), 0)`,
      total_amount: sql<string>`COALESCE(SUM((${simplePurchases.total_amount})::numeric), 0)`,
    })
    .from(simplePurchases)
    .where(
      and(
        eq(simplePurchases.organization_id, orgId),
        sql`${simplePurchases.deleted_at} IS NULL`,
      ),
    )
    .groupBy(simplePurchases.vendor_id);

  const simpleMap = new Map(simpleAggs.map((a) => [a.vendor_id, a]));

  const enriched = vendorList.map((v) => {
    const s = simpleMap.get(v.id);
    const totalAmount = Number(v.total_amount) + (s ? Number(s.total_amount) : 0);
    const totalPaid = Number(v.total_paid) + (s ? Number(s.total_paid) : 0);
    return {
      ...v,
      total_purchases: v.total_purchases + (s ? s.total_purchases : 0),
      total_paid: totalPaid,
      total_amount: totalAmount,
      due_balance: Number(v.opening_balance) + totalAmount - totalPaid,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = vendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [vendor] = await db
      .insert(vendors)
      .values({
        organization_id: orgId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        type: parsed.data.type,
        opening_balance: parsed.data.opening_balance
          ? String(parsed.data.opening_balance)
          : "0",
      })
      .returning();

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 },
    );
  }
}
