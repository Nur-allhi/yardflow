import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  salePayments,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { salePaymentSchema } from "@/lib/validations/schemas";
import { requireOrg } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = salePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.id, id),
            eq(sales.organization_id, orgId),
            sql`${sales.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!sale) {
        throw new Error("Sale not found");
      }

      const oldPaid = Number(sale.paid_amount);
      const totalAmount = Number(sale.total_amount);
      const newPaid = oldPaid + parsed.data.amount;

      let status: "paid" | "partial" | "due";
      if (newPaid >= totalAmount) {
        status = "paid";
      } else if (newPaid > 0) {
        status = "partial";
      } else {
        status = "due";
      }

      const [payment] = await tx
        .insert(salePayments)
        .values({
          organization_id: orgId,
          sale_id: id,
          amount: parsed.data.amount.toFixed(2),
          account_id: parsed.data.account_id,
          payment_date: new Date(parsed.data.payment_date),
          note: parsed.data.note || null,
        })
        .returning();

      await tx
        .update(sales)
        .set({
          paid_amount: newPaid.toFixed(2),
          status,
          updated_at: sql`NOW()`,
        })
        .where(
          and(
            eq(sales.id, id),
            eq(sales.organization_id, orgId),
          ),
        );

      await recordAccountTransaction({
        organization_id: orgId,
        account_id: parsed.data.account_id,
        type: "credit",
        amount: parsed.data.amount.toFixed(2),
        reference_type: "sale_payment",
        reference_id: payment.id,
        transaction_date: new Date(parsed.data.payment_date),
        note: parsed.data.note || null,
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    const status = message === "Sale not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
