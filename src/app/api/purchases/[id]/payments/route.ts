import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  purchases,
  purchaseItems,
  purchasePayments,
  vendors,
  materialSubtypes,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { purchasePaymentSchema } from "@/lib/validations/schemas";
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
    const parsed = purchasePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
            sql`${purchases.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!purchase) {
        throw new Error("Purchase not found");
      }

      const items = await tx
        .select({ name: materialSubtypes.name })
        .from(purchaseItems)
        .innerJoin(materialSubtypes, eq(purchaseItems.subtype_id, materialSubtypes.id))
        .where(
          and(
            eq(purchaseItems.purchase_id, id),
            sql`${purchaseItems.deleted_at} IS NULL`,
          ),
        );

      const [vendorRow] = await tx
        .select({ name: vendors.name })
        .from(vendors)
        .where(eq(vendors.id, purchase.vendor_id))
        .limit(1);

      const itemNames = items.map(i => i.name);
      const itemsStr = itemNames.length <= 3
        ? itemNames.join(', ')
        : itemNames.slice(0, 3).join(', ') + ` & ${itemNames.length - 3} more`;
      const paymentNote = `Payment to ${vendorRow?.name || 'Vendor'} — ${itemsStr}`;

      const oldPaid = Number(purchase.paid_amount);
      const totalAmount = Number(purchase.total_amount);
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
        .insert(purchasePayments)
        .values({
          organization_id: orgId,
          purchase_id: id,
          amount: parsed.data.amount.toFixed(2),
          account_id: parsed.data.account_id,
          payment_date: new Date(parsed.data.payment_date),
          note: parsed.data.note || null,
        })
        .returning();

      await tx
        .update(purchases)
        .set({
          paid_amount: newPaid.toFixed(2),
          status,
          updated_at: sql`NOW()`,
        })
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.organization_id, orgId),
          ),
        );

      await recordAccountTransaction({
        organization_id: orgId,
        account_id: parsed.data.account_id,
        type: "debit",
        amount: parsed.data.amount.toFixed(2),
        reference_type: "purchase_payment",
        reference_id: payment.id,
        transaction_date: new Date(parsed.data.payment_date),
        note: parsed.data.note ? `${parsed.data.note} — ${paymentNote}` : paymentNote,
      });

      return payment;
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "payment",
      entityType: "purchase_payment",
      entityId: result.id,
      description: `Recorded payment of ${parsed.data.amount} for purchase`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
