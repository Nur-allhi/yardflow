import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  simplePurchases,
  simplePurchaseItems,
  simplePurchasePayments,
  vendors,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { recordAccountTransaction } from "@/lib/accounts";

const createPaymentSchema = z.object({
  amount: z.number().positive().finite(),
  account_id: z.string().uuid(),
  payment_date: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;

  try {
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { amount, account_id, payment_date, note } = parsed.data;

    const payment = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .select({
          id: simplePurchases.id,
          vendor_id: simplePurchases.vendor_id,
          total_amount: simplePurchases.total_amount,
          paid_amount: simplePurchases.paid_amount,
        })
        .from(simplePurchases)
        .where(
          and(
            eq(simplePurchases.id, id),
            eq(simplePurchases.organization_id, orgId),
            sql`${simplePurchases.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!purchase) {
        throw new Error("Purchase not found");
      }

      const items = await tx
        .select({ description: simplePurchaseItems.description })
        .from(simplePurchaseItems)
        .where(
          and(
            eq(simplePurchaseItems.purchase_id, id),
            sql`${simplePurchaseItems.deleted_at} IS NULL`,
          ),
        );

      const [vendorRow] = await tx
        .select({ name: vendors.name })
        .from(vendors)
        .where(eq(vendors.id, purchase.vendor_id))
        .limit(1);

      const itemNames = items.map(i => i.description);
      const itemsStr = itemNames.length <= 3
        ? itemNames.join(', ')
        : itemNames.slice(0, 3).join(', ') + ` & ${itemNames.length - 3} more`;
      const paymentNote = `Payment to ${vendorRow?.name || 'Vendor'} — ${itemsStr}`;

      const [paymentRecord] = await tx
        .insert(simplePurchasePayments)
        .values({
          organization_id: orgId,
          purchase_id: id,
          amount: amount.toFixed(2),
          account_id,
          payment_date: new Date(payment_date),
          note: note || null,
        })
        .returning();

      const newPaidAmount = Number(purchase.paid_amount) + amount;
      const totalAmountNum = Number(purchase.total_amount);
      const newStatus =
        newPaidAmount >= totalAmountNum ? "paid" : "partial";

      await tx
        .update(simplePurchases)
        .set({
          paid_amount: newPaidAmount.toFixed(2),
          status: newStatus,
          updated_at: sql`NOW()`,
        })
        .where(
          and(
            eq(simplePurchases.id, id),
            eq(simplePurchases.organization_id, orgId),
          ),
        );

      await recordAccountTransaction({
        organization_id: orgId,
        account_id,
        type: "debit",
        amount: amount.toFixed(2),
        reference_type: "purchase_payment",
        reference_id: paymentRecord.id,
        note: note ? `${note} — ${paymentNote}` : paymentNote,
        transaction_date: new Date(payment_date),
      });

      return paymentRecord;
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "payment",
      entityType: "simple_purchase",
      entityId: id,
      description: `Recorded payment of ${amount}`,
    });

    return NextResponse.json(
      {
        ...payment,
        amount: Number(payment.amount),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error recording payment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
