import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { accountTransferSchema } from "@/lib/validations/schemas";
import { recordAccountTransaction } from "@/lib/accounts";

export async function POST(request: Request) {
  const session = await requireSession();

  try {
    const body = await request.json();
    const parsed = accountTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { from_account_id, to_account_id, amount, transfer_date, note } =
      parsed.data;

    if (from_account_id === to_account_id) {
      return NextResponse.json(
        { error: "Source and destination accounts must be different" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [fromAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, from_account_id),
            eq(accounts.organization_id, session.org_id),
            eq(accounts.is_active, true),
            sql`${accounts.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!fromAccount) {
        throw new Error("Source account not found or inactive");
      }

      const [toAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, to_account_id),
            eq(accounts.organization_id, session.org_id),
            eq(accounts.is_active, true),
            sql`${accounts.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!toAccount) {
        throw new Error("Destination account not found or inactive");
      }

      const fromBalance = Number(fromAccount.current_balance);
      if (fromBalance < amount) {
        throw new Error("Insufficient balance in source account");
      }

      await recordAccountTransaction({
        organization_id: session.org_id,
        account_id: from_account_id,
        type: "debit",
        amount: String(amount),
        reference_type: "transfer",
        reference_id: to_account_id,
        note: note || null,
        transaction_date: new Date(transfer_date),
      });

      await recordAccountTransaction({
        organization_id: session.org_id,
        account_id: to_account_id,
        type: "credit",
        amount: String(amount),
        reference_type: "transfer",
        reference_id: from_account_id,
        note: note || null,
        transaction_date: new Date(transfer_date),
      });

      const [updatedFrom] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, from_account_id))
        .limit(1);

      const [updatedTo] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, to_account_id))
        .limit(1);

      return {
        from_account: {
          ...updatedFrom,
          current_balance: Number(updatedFrom.current_balance),
        },
        to_account: {
          ...updatedTo,
          current_balance: Number(updatedTo.current_balance),
        },
      };
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "transfer",
      entityType: "account_transaction",
      description: `Transferred ${amount} from ${result.from_account.name} to ${result.to_account.name}`,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process transfer";
    const status = message.includes("not found") || message.includes("Insufficient") || message.includes("must be different") ? 400 : 500;
    console.error("Error processing transfer:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
