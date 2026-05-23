import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  scrapPool,
  salePayments,
} from "@/lib/db/schema";

import { scrapSaleSchema } from "@/lib/validations/schemas";
import { requireOrg } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = scrapSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      sale_date,
      quantity_kg,
      price_per_kg,
      buyer_name,
      amount_received,
      account_id,
      note,
    } = parsed.data;

    const totalAmount = quantity_kg * price_per_kg;

    let saleStatus: "paid" | "partial" | "due";
    if (amount_received >= totalAmount) {
      saleStatus = "paid";
    } else if (amount_received > 0) {
      saleStatus = "partial";
    } else {
      saleStatus = "due";
    }

    const saleNote = buyer_name
      ? `Buyer: ${buyer_name}${note ? ` - ${note}` : ""}`
      : (note || null);

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          organization_id: orgId,
          customer_id: null,
          sale_type: "scrap",
          is_quick_cash_sale: false,
          sale_date: new Date(sale_date),
          total_amount: totalAmount.toFixed(2),
          paid_amount: amount_received.toFixed(2),
          status: saleStatus,
          note: saleNote,
        })
        .returning();

      await tx.insert(saleItems).values({
        organization_id: orgId,
        sale_id: sale.id,
        subtype_id: null,
        quantity_kg: quantity_kg.toFixed(3),
        price_per_kg: price_per_kg.toFixed(2),
      });

      await tx.insert(scrapPool).values({
        organization_id: orgId,
        movement_type: "out",
        quantity_kg: quantity_kg.toFixed(3),
        reference_id: sale.id,
        movement_date: new Date(sale_date),
      });

      if (amount_received > 0) {
        const [payment] = await tx
          .insert(salePayments)
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
    console.error("Error creating scrap sale:", error);
    return NextResponse.json(
      { error: "Failed to create scrap sale" },
      { status: 500 },
    );
  }
}
