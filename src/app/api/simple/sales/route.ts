import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simpleSales,
  simpleSaleItems,
  simpleSalePayments,
  customers,
  inventoryPool,
  inventoryMovements,
} from "@/lib/db/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";
import { z } from "zod";

const simpleSaleItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity_kg: z.number().positive("Quantity must be positive"),
  price_per_kg: z.number().positive("Price must be positive"),
});

const simpleSaleCreateSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().optional(),
  sale_type: z.enum(["fabricated", "raw_passthrough", "scrap"]),
  is_quick_cash_sale: z.boolean().optional(),
  sale_date: z.string().min(1, "Date is required"),
  items: z.array(simpleSaleItemSchema).min(1, "At least one item required"),
  paid_amount: z.number().min(0).optional().default(0),
  account_id: z.string().uuid().optional(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const orgId = session.org_id;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");
    const status = searchParams.get("status");
    const saleType = searchParams.get("sale_type");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "15", 10)));
    const offset = (page - 1) * limit;

    const conditions: (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof sql>)[] = [
      eq(simpleSales.organization_id, orgId),
      sql`${simpleSales.deleted_at} IS NULL`,
    ];

    if (customerId) conditions.push(eq(simpleSales.customer_id, customerId));
    if (status && status !== "all") conditions.push(eq(simpleSales.status, status as "paid" | "partial" | "due"));
    if (saleType) conditions.push(eq(simpleSales.sale_type, saleType as "fabricated" | "raw_passthrough" | "scrap"));
    if (dateFrom) conditions.push(gte(simpleSales.sale_date, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(simpleSales.sale_date, new Date(dateTo)));

    const filterConditions = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(simpleSales)
      .leftJoin(
        customers,
        and(eq(simpleSales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`),
      )
      .where(filterConditions);

    const saleList = await db
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
      })
      .from(simpleSales)
      .leftJoin(
        customers,
        and(eq(simpleSales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`),
      )
      .where(filterConditions)
      .orderBy(desc(simpleSales.sale_date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      sales: saleList.map((s) => ({
        ...s,
        total_amount: Number(s.total_amount),
        paid_amount: Number(s.paid_amount),
        due_amount: Number(s.due_amount),
        customer_name: s.customer_name || "Cash Sale",
      })),
      total_count: count,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching simple sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const orgId = session.org_id;

    const body = await request.json();
    const parsed = simpleSaleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity_kg * item.price_per_kg,
      0,
    );
    const paidAmount = parsed.data.paid_amount ?? 0;

    if (paidAmount > 0 && !parsed.data.account_id) {
      return NextResponse.json(
        { error: "account_id is required when paid_amount > 0" },
        { status: 400 },
      );
    }

    let status: "paid" | "partial" | "due";
    if (paidAmount >= totalAmount) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    } else {
      status = "due";
    }

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(simpleSales)
        .values({
          organization_id: orgId,
          customer_id: parsed.data.customer_id || null,
          customer_name: parsed.data.customer_name || null,
          sale_type: parsed.data.sale_type,
          is_quick_cash_sale: parsed.data.is_quick_cash_sale ?? false,
          sale_date: new Date(parsed.data.sale_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: paidAmount.toFixed(2),
          status,
          note: parsed.data.note || null,
        })
        .returning();

      const [pool] = await tx
        .select()
        .from(inventoryPool)
        .where(eq(inventoryPool.organization_id, orgId))
        .limit(1);

      for (const item of parsed.data.items) {
        await tx.insert(simpleSaleItems).values({
          organization_id: orgId,
          sale_id: sale.id,
          description: item.description,
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: item.price_per_kg.toFixed(2),
        });

        const avgPrice = pool ? Number(pool.avg_price_per_kg) : 0;
        const cogs = item.quantity_kg * avgPrice;

        await tx
          .update(inventoryPool)
          .set({
            total_quantity_kg: sql`${inventoryPool.total_quantity_kg}::numeric - ${item.quantity_kg.toFixed(3)}::numeric`,
            total_value: sql`${inventoryPool.total_value}::numeric - ${cogs.toFixed(2)}::numeric`,
          })
          .where(eq(inventoryPool.organization_id, orgId));

        await tx.insert(inventoryMovements).values({
          organization_id: orgId,
          movement_type: "out",
          quantity_kg: item.quantity_kg.toFixed(3),
          price_per_kg: avgPrice.toFixed(2),
          total_value: cogs.toFixed(2),
          reference_type: "sale",
          reference_id: sale.id,
          description: item.description,
          movement_date: new Date(parsed.data.sale_date),
        });
      }

      if (paidAmount > 0 && parsed.data.account_id) {
        const [payment] = await tx
          .insert(simpleSalePayments)
          .values({
            organization_id: orgId,
            sale_id: sale.id,
            amount: paidAmount.toFixed(2),
            account_id: parsed.data.account_id,
            payment_date: new Date(parsed.data.sale_date),
            note: parsed.data.note || null,
          })
          .returning();

        await recordAccountTransaction({
          organization_id: orgId,
          account_id: parsed.data.account_id,
          type: "credit",
          amount: paidAmount.toFixed(2),
          reference_type: "sale_payment",
          reference_id: payment.id,
          transaction_date: new Date(parsed.data.sale_date),
          note: parsed.data.note || null,
        });
      }

      return sale;
    });

    let customerName = parsed.data.customer_name || null;
    if (!customerName && parsed.data.customer_id) {
      const [customer] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(
          and(eq(customers.id, parsed.data.customer_id), sql`${customers.deleted_at} IS NULL`),
        )
        .limit(1);
      customerName = customer?.name ?? "Unknown";
    }

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "simple_sale",
      entityId: result.id,
      description: `Created simple sale for ${customerName ?? "Unknown"}`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating simple sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}
