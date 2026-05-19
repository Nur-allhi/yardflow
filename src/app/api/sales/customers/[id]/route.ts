import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sales } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { customerSchema } from "@/lib/validations/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const salesHistory = await db
    .select({
      id: sales.id,
      sale_type: sales.sale_type,
      is_quick_cash_sale: sales.is_quick_cash_sale,
      sale_date: sales.sale_date,
      total_amount: sales.total_amount,
      paid_amount: sales.paid_amount,
      due_amount: sales.due_amount,
      status: sales.status,
      note: sales.note,
    })
    .from(sales)
    .where(
      and(
        eq(sales.customer_id, id),
        eq(sales.organization_id, orgId),
        sql`${sales.deleted_at} IS NULL`,
      ),
    )
    .orderBy(sql`${sales.sale_date} DESC`);

  return NextResponse.json({
    ...customer,
    opening_balance: Number(customer.opening_balance),
    sales: salesHistory.map((s) => ({
      ...s,
      total_amount: Number(s.total_amount),
      paid_amount: Number(s.paid_amount),
      due_amount: Number(s.due_amount),
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const setData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) setData.name = parsed.data.name;
    if (parsed.data.phone !== undefined) setData.phone = parsed.data.phone || null;
    if (parsed.data.address !== undefined) setData.address = parsed.data.address || null;
    if (parsed.data.type !== undefined) setData.type = parsed.data.type;
    if (parsed.data.opening_balance !== undefined) {
      setData.opening_balance = String(parsed.data.opening_balance);
    }
    setData.updated_at = sql`NOW()`;

    const [updated] = await db
      .update(customers)
      .set(setData)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.organization_id, orgId),
          sql`${customers.deleted_at} IS NULL`,
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [deleted] = await db
      .update(customers)
      .set({ deleted_at: new Date(), updated_at: sql`NOW()` })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.organization_id, orgId),
          sql`${customers.deleted_at} IS NULL`,
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}
