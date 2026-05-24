import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  salePayments,
  customers,
  materialSubtypes,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { salePaymentSchema } from "@/lib/validations/schemas";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth/session";
import { recordAccountTransaction } from "@/lib/accounts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

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

      const items = await tx
        .select({ name: materialSubtypes.name })
        .from(saleItems)
        .innerJoin(materialSubtypes, eq(saleItems.subtype_id, materialSubtypes.id))
        .where(
          and(
            eq(saleItems.sale_id, id),
            sql`${saleItems.deleted_at} IS NULL`,
          ),
        );

      let customerLabel: string | null = null;
      if (sale.customer_id) {
        const [custRow] = await tx
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, sale.customer_id))
          .limit(1);
        customerLabel = custRow?.name || null;
      }

      const itemNames = items.map(i => i.name);
      const itemsStr = itemNames.length <= 3
        ? itemNames.join(', ')
        : itemNames.slice(0, 3).join(', ') + ` & ${itemNames.length - 3} more`;
      const saleNote = `Receipt from ${customerLabel || 'Customer'} — ${itemsStr}`;

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
        note: parsed.data.note ? `${parsed.data.note} — ${saleNote}` : saleNote,
      });

      return payment;
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "payment",
      entityType: "sale_payment",
      entityId: result.id,
      description: `Recorded payment of ${parsed.data.amount} for sale`,
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
