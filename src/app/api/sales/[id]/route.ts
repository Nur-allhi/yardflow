import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  customers,
  saleItems,
  materialSubtypes,
  salePayments,
  accounts,
  stockLedger,
  scrapPool,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { saleSchema } from "@/lib/validations/schemas";
import { calculateWAC } from "@/lib/calculations/wac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

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
      customer_name: sql`COALESCE(${sales.customer_name}, ${customers.name})`,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existingSale = await db
      .select({ id: sales.id, sale_type: sales.sale_type })
      .from(sales)
      .where(
        and(
          eq(sales.id, id),
          eq(sales.organization_id, orgId),
          sql`${sales.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existingSale.length) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );

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

    await db.transaction(async (tx) => {
      await tx
        .delete(stockLedger)
        .where(
          and(
            inArray(stockLedger.reference_type, [
              "sale_fabricated",
              "sale_raw",
            ]),
            eq(stockLedger.reference_id, id),
            eq(stockLedger.organization_id, orgId),
          ),
        );

      await tx
        .delete(scrapPool)
        .where(
          and(
            eq(scrapPool.movement_type, "out"),
            eq(scrapPool.reference_id, id),
            eq(scrapPool.organization_id, orgId),
          ),
        );

      await tx
        .delete(saleItems)
        .where(
          and(
            eq(saleItems.sale_id, id),
            eq(saleItems.organization_id, orgId),
          ),
        );

      await tx
        .update(sales)
        .set({
          customer_id: parsed.data.customer_id || null,
          sale_type: saleType,
          is_quick_cash_sale: false,
          sale_date: new Date(parsed.data.sale_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: "0",
          status: "due",
          note: parsed.data.note || null,
        })
        .where(
          and(
            eq(sales.id, id),
            eq(sales.organization_id, orgId),
          ),
        );

      for (const item of parsed.data.items) {
        await tx.insert(saleItems).values({
          organization_id: orgId,
          sale_id: id,
          subtype_id: item.subtype_id,
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
        });

        if (saleType === "scrap") {
          await tx.insert(scrapPool).values({
            organization_id: orgId,
            movement_type: "out",
            quantity_kg: item.quantity_kg.toFixed(3),
            reference_id: id,
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
            reference_id: id,
            movement_date: new Date(parsed.data.sale_date),
          });
        }
      }
    });

    const subtypeIds = [
      ...new Set(parsed.data.items.map((i) => i.subtype_id)),
    ];
    await Promise.all(
      subtypeIds.map((subtypeId) => calculateWAC(orgId, subtypeId)),
    );

    const [updatedSale] = await db
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
      })
      .from(sales)
      .where(
        and(
          eq(sales.id, id),
          eq(sales.organization_id, orgId),
          sql`${sales.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    return NextResponse.json({
      ...updatedSale,
      total_amount: Number(updatedSale.total_amount),
      paid_amount: Number(updatedSale.paid_amount),
      due_amount: Number(updatedSale.due_amount),
    });
  } catch (error) {
    console.error("Error updating sale:", error);
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
    const existingSale = await db
      .select({ id: sales.id })
      .from(sales)
      .where(
        and(
          eq(sales.id, id),
          eq(sales.organization_id, orgId),
          sql`${sales.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existingSale.length) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const itemSubtypes = await db
      .select({ subtype_id: saleItems.subtype_id })
      .from(saleItems)
      .where(
        and(
          eq(saleItems.sale_id, id),
          eq(saleItems.organization_id, orgId),
          sql`${saleItems.deleted_at} IS NULL`,
        ),
      );

    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(stockLedger)
        .set({ deleted_at: now })
        .where(
          and(
            eq(stockLedger.reference_id, id),
            eq(stockLedger.organization_id, orgId),
          ),
        );

      await tx
        .update(scrapPool)
        .set({ deleted_at: now })
        .where(
          and(
            eq(scrapPool.reference_id, id),
            eq(scrapPool.organization_id, orgId),
          ),
        );

      await tx
        .update(saleItems)
        .set({ deleted_at: now })
        .where(
          and(
            eq(saleItems.sale_id, id),
            eq(saleItems.organization_id, orgId),
          ),
        );

      await tx
        .update(salePayments)
        .set({ deleted_at: now })
        .where(
          and(
            eq(salePayments.sale_id, id),
            eq(salePayments.organization_id, orgId),
          ),
        );

      await tx
        .update(sales)
        .set({ deleted_at: now })
        .where(
          and(
            eq(sales.id, id),
            eq(sales.organization_id, orgId),
          ),
        );
    });

    const affectedSubtypeIds = [
      ...new Set(itemSubtypes.map((i) => i.subtype_id).filter((v): v is string => v !== null)),
    ];
    await Promise.all(
      affectedSubtypeIds.map((subtypeId) => calculateWAC(orgId, subtypeId)),
    );

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "delete",
      entityType: "sale",
      entityId: id,
      description: "Deleted sale",
    });

    return NextResponse.json({ message: "Sale voided successfully" });
  } catch (error) {
    console.error("Error voiding sale:", error);
    return NextResponse.json(
      { error: "Failed to void sale" },
      { status: 500 },
    );
  }
}
