import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors, purchases } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { vendorSchema } from "@/lib/validations/schemas";
import { requireOrg } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
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

  const purchaseHistory = await db
    .select({
      id: purchases.id,
      purchase_date: purchases.purchase_date,
      total_amount: purchases.total_amount,
      paid_amount: purchases.paid_amount,
      due_amount: purchases.due_amount,
      status: purchases.status,
      note: purchases.note,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.vendor_id, id),
        eq(purchases.organization_id, orgId),
        sql`${purchases.deleted_at} IS NULL`,
      ),
    )
    .orderBy(sql`${purchases.purchase_date} DESC`);

  return NextResponse.json({
    ...vendor,
    purchase_history: purchaseHistory,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const [existing] = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, id),
          eq(vendors.organization_id, orgId),
          sql`${vendors.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(vendors)
      .set({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        type: parsed.data.type,
        opening_balance: parsed.data.opening_balance
          ? String(parsed.data.opening_balance)
          : "0",
        updated_at: sql`NOW()`,
      })
      .where(
        and(
          eq(vendors.id, id),
          eq(vendors.organization_id, orgId),
        ),
      )
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [existing] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(
      and(
        eq(vendors.id, id),
        eq(vendors.organization_id, orgId),
        sql`${vendors.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  await db
    .update(vendors)
    .set({ deleted_at: sql`NOW()` })
    .where(
      and(
        eq(vendors.id, id),
        eq(vendors.organization_id, orgId),
      ),
    );

  return NextResponse.json({ success: true });
}
