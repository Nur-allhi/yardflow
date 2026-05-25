import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simpleSales,
  simpleSaleItems,
  simpleSalePayments,
  customers,
  accounts,
  inventoryPool,
  inventoryMovements,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { z } from "zod";

const simpleSaleUpdateSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  sale_type: z.enum(["fabricated", "raw_passthrough", "scrap"]).optional(),
  sale_date: z.string().optional(),
  note: z.string().nullable().optional(),
  total_amount: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  const [sale] = await db
    .select({
      id: simpleSales.id,
      customer_id: simpleSales.customer_id,
      customer_name: sql`COALESCE(${simpleSales.customer_name}, ${customers.name})`,
      sale_type: simpleSales.sale_type,
      is_quick_cash_sale: simpleSales.is_quick_cash_sale,
      sale_date: simpleSales.sale_date,
      total_amount: simpleSales.total_amount,
      paid_amount: simpleSales.paid_amount,
      due_amount: simpleSales.due_amount,
      status: simpleSales.status,
      note: simpleSales.note,
      created_at: simpleSales.created_at,
      customer_phone: customers.phone,
    })
    .from(simpleSales)
    .leftJoin(
      customers,
      and(eq(simpleSales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`),
    )
    .where(
      and(
        eq(simpleSales.id, id),
        eq(simpleSales.organization_id, orgId),
        sql`${simpleSales.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: simpleSaleItems.id,
      description: simpleSaleItems.description,
      quantity_kg: simpleSaleItems.quantity_kg,
      price_per_kg: simpleSaleItems.price_per_kg,
      total_amount: simpleSaleItems.total_amount,
    })
    .from(simpleSaleItems)
    .where(
      and(
        eq(simpleSaleItems.sale_id, id),
        eq(simpleSaleItems.organization_id, orgId),
        sql`${simpleSaleItems.deleted_at} IS NULL`,
      ),
    );

  const payments = await db
    .select({
      id: simpleSalePayments.id,
      amount: simpleSalePayments.amount,
      payment_date: simpleSalePayments.payment_date,
      note: simpleSalePayments.note,
      account_id: simpleSalePayments.account_id,
      account_name: accounts.name,
    })
    .from(simpleSalePayments)
    .leftJoin(
      accounts,
      and(eq(simpleSalePayments.account_id, accounts.id), sql`${accounts.deleted_at} IS NULL`),
    )
    .where(
      and(
        eq(simpleSalePayments.sale_id, id),
        eq(simpleSalePayments.organization_id, orgId),
        sql`${simpleSalePayments.deleted_at} IS NULL`,
      ),
    )
    .orderBy(simpleSalePayments.payment_date);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = simpleSaleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({
        id: simpleSales.id,
        total_amount: simpleSales.total_amount,
        paid_amount: simpleSales.paid_amount,
      })
      .from(simpleSales)
      .where(
        and(
          eq(simpleSales.id, id),
          eq(simpleSales.organization_id, orgId),
          sql`${simpleSales.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const totalAmount = parsed.data.total_amount ?? Number(existing.total_amount);
    const paidAmount = parsed.data.paid_amount ?? Number(existing.paid_amount);

    let status: "paid" | "partial" | "due";
    if (paidAmount >= totalAmount) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    } else {
      status = "due";
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: sql`NOW()`,
    };

    if (parsed.data.customer_id !== undefined) updateData.customer_id = parsed.data.customer_id;
    if (parsed.data.customer_name !== undefined) updateData.customer_name = parsed.data.customer_name;
    if (parsed.data.sale_type !== undefined) updateData.sale_type = parsed.data.sale_type;
    if (parsed.data.sale_date !== undefined) updateData.sale_date = new Date(parsed.data.sale_date);
    if (parsed.data.note !== undefined) updateData.note = parsed.data.note;
    if (parsed.data.total_amount !== undefined) updateData.total_amount = parsed.data.total_amount.toFixed(2);
    if (parsed.data.paid_amount !== undefined) updateData.paid_amount = parsed.data.paid_amount.toFixed(2);

    await db
      .update(simpleSales)
      .set(updateData)
      .where(and(eq(simpleSales.id, id), eq(simpleSales.organization_id, orgId)));

    const [updated] = await db
      .select({
        id: simpleSales.id,
        customer_id: simpleSales.customer_id,
        customer_name: simpleSales.customer_name,
        sale_type: simpleSales.sale_type,
        is_quick_cash_sale: simpleSales.is_quick_cash_sale,
        sale_date: simpleSales.sale_date,
        total_amount: simpleSales.total_amount,
        paid_amount: simpleSales.paid_amount,
        due_amount: simpleSales.due_amount,
        status: simpleSales.status,
        note: simpleSales.note,
      })
      .from(simpleSales)
      .where(and(eq(simpleSales.id, id), eq(simpleSales.organization_id, orgId)))
      .limit(1);

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "update",
      entityType: "simple_sale",
      entityId: id,
      description: "Updated simple sale",
    });

    return NextResponse.json({
      ...updated,
      total_amount: Number(updated.total_amount),
      paid_amount: Number(updated.paid_amount),
      due_amount: Number(updated.due_amount),
    });
  } catch (error) {
    console.error("Error updating simple sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const [existing] = await db
      .select({ id: simpleSales.id })
      .from(simpleSales)
      .where(
        and(
          eq(simpleSales.id, id),
          eq(simpleSales.organization_id, orgId),
          sql`${simpleSales.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      const now = new Date();

      const movements = await tx
        .select()
        .from(inventoryMovements)
        .where(
          and(
            eq(inventoryMovements.reference_id, id),
            eq(inventoryMovements.reference_type, "sale"),
            eq(inventoryMovements.organization_id, orgId),
          ),
        );

      for (const mov of movements) {
        const qty = Number(mov.quantity_kg);
        const price = Number(mov.price_per_kg ?? 0);
        const value = qty * price;

        await tx
          .update(inventoryPool)
          .set({
            total_quantity_kg: sql`${inventoryPool.total_quantity_kg}::numeric + ${qty.toFixed(3)}::numeric`,
            total_value: sql`${inventoryPool.total_value}::numeric + ${value.toFixed(2)}::numeric`,
          })
          .where(eq(inventoryPool.organization_id, orgId));
      }

      await tx
        .delete(inventoryMovements)
        .where(
          and(
            eq(inventoryMovements.reference_id, id),
            eq(inventoryMovements.reference_type, "sale"),
            eq(inventoryMovements.organization_id, orgId),
          ),
        );

      await tx
        .update(simpleSaleItems)
        .set({ deleted_at: now })
        .where(
          and(eq(simpleSaleItems.sale_id, id), eq(simpleSaleItems.organization_id, orgId)),
        );

      await tx
        .update(simpleSalePayments)
        .set({ deleted_at: now })
        .where(
          and(eq(simpleSalePayments.sale_id, id), eq(simpleSalePayments.organization_id, orgId)),
        );

      await tx
        .update(simpleSales)
        .set({ deleted_at: now })
        .where(and(eq(simpleSales.id, id), eq(simpleSales.organization_id, orgId)));
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "delete",
      entityType: "simple_sale",
      entityId: id,
      description: "Deleted simple sale",
    });

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting simple sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 },
    );
  }
}
