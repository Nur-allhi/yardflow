import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simpleSales,
  simpleSaleItems,
  simpleSalePayments,
  scrapPool,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";
import { z } from "zod";

const simpleScrapSaleSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  buyer_name: z.string().optional(),
  quantity_kg: z.number().positive("Quantity must be positive"),
  price_per_kg: z.number().positive("Price must be positive"),
  amount_received: z.number().min(0, "Amount must be >= 0"),
  account_id: z.string().uuid("Invalid account"),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = simpleScrapSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      sale_date,
      buyer_name,
      quantity_kg,
      price_per_kg,
      amount_received,
      account_id,
      note,
    } = parsed.data;

    const totalAmount = quantity_kg * price_per_kg;

    let status: "paid" | "partial" | "due";
    if (amount_received >= totalAmount) {
      status = "paid";
    } else if (amount_received > 0) {
      status = "partial";
    } else {
      status = "due";
    }

    const saleNote = buyer_name
      ? `Scrap buyer: ${buyer_name}${note ? ` — ${note}` : ""}`
      : (note || "Scrap sale");

    const result = await db.transaction(async (tx) => {
      const [scrapQty] = await tx
        .select({
          total: sql<number>`COALESCE(SUM(
            CASE WHEN ${scrapPool.movement_type} = 'in' THEN CAST(${scrapPool.quantity_kg} AS numeric) ELSE -CAST(${scrapPool.quantity_kg} AS numeric) END
          ), 0)`,
        })
        .from(scrapPool)
        .where(
          and(
            eq(scrapPool.organization_id, orgId),
            sql`${scrapPool.deleted_at} IS NULL`,
          ),
        );

      const availableKg = Number(scrapQty.total);
      if (quantity_kg > availableKg) {
        throw new Error(
          `Insufficient scrap: ${quantity_kg.toFixed(3)} kg sold but only ${availableKg.toFixed(3)} kg available`,
        );
      }

      const [sale] = await tx
        .insert(simpleSales)
        .values({
          organization_id: orgId,
          customer_id: null,
          customer_name: buyer_name || null,
          sale_type: "scrap",
          is_quick_cash_sale: false,
          sale_date: new Date(sale_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: amount_received.toFixed(2),
          status,
          note: saleNote,
        })
        .returning();

      await tx.insert(simpleSaleItems).values({
        organization_id: orgId,
        sale_id: sale.id,
        description: buyer_name ? `Scrap — ${buyer_name}` : "Scrap sale",
        quantity_kg: quantity_kg.toFixed(3),
        price_per_kg: price_per_kg.toFixed(2),
      });

      await tx.insert(scrapPool).values({
        organization_id: orgId,
        movement_type: "out",
        quantity_kg: quantity_kg.toFixed(3),
        reference_id: sale.id,
        movement_date: new Date(sale_date),
        note: saleNote,
      });

      if (amount_received > 0) {
        const [payment] = await tx
          .insert(simpleSalePayments)
          .values({
            organization_id: orgId,
            sale_id: sale.id,
            amount: amount_received.toFixed(2),
            account_id,
            payment_date: new Date(sale_date),
            note: saleNote,
          })
          .returning();

        await recordAccountTransaction({
          organization_id: orgId,
          account_id,
          type: "credit",
          amount: amount_received.toFixed(2),
          reference_type: "sale_payment",
          reference_id: payment.id,
          transaction_date: new Date(sale_date),
          note: saleNote,
        });
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating simple scrap sale:", error);
    const message = error instanceof Error ? error.message : "Failed to create scrap sale";
    const status = message.includes("Insufficient scrap") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
