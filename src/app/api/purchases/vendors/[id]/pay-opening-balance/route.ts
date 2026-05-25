import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
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
    const { amount, account_id, payment_date, note } = body;

    if (!amount || amount <= 0 || !account_id) {
      return NextResponse.json(
        { error: "amount and account_id are required" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [vendor] = await tx
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

      if (!vendor) throw new Error("Vendor not found");

      const currentOpeningBalance = Number(vendor.opening_balance);
      if (amount > currentOpeningBalance) {
        throw new Error("Amount exceeds opening balance");
      }

      const newOpeningBalance = currentOpeningBalance - amount;
      await tx
        .update(vendors)
        .set({
          opening_balance: String(newOpeningBalance),
          updated_at: sql`NOW()`,
        })
        .where(eq(vendors.id, id));

      await recordAccountTransaction({
        organization_id: orgId,
        account_id,
        type: "debit",
        amount: String(amount),
        reference_type: "other",
        reference_id: id,
        transaction_date: new Date(payment_date),
        note: note || `Opening balance payment to vendor: ${vendor.name}`,
      });

      return { success: true };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process payment";
    const status = message.includes("not found") ? 404 : (message.includes("exceeds") ? 400 : 500);
    return NextResponse.json({ error: message }, { status });
  }
}
