import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { accountTransferSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  const orgId = await requireOrg();

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
            eq(accounts.organization_id, orgId),
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
            eq(accounts.organization_id, orgId),
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

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: from_account_id,
        type: "debit",
        amount: String(amount),
        reference_type: "transfer",
        reference_id: to_account_id,
        note: note || null,
        transaction_date: new Date(transfer_date),
      });

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: to_account_id,
        type: "credit",
        amount: String(amount),
        reference_type: "transfer",
        reference_id: from_account_id,
        note: note || null,
        transaction_date: new Date(transfer_date),
      });

      const [updatedFrom] = await tx
        .update(accounts)
        .set({
          current_balance: String(fromBalance - amount),
          updated_at: sql`NOW()`,
        })
        .where(eq(accounts.id, from_account_id))
        .returning();

      const [updatedTo] = await tx
        .update(accounts)
        .set({
          current_balance: String(
            Number(toAccount.current_balance) + amount,
          ),
          updated_at: sql`NOW()`,
        })
        .where(eq(accounts.id, to_account_id))
        .returning();

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

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process transfer";
    const status = message.includes("not found") || message.includes("Insufficient") || message.includes("must be different") ? 400 : 500;
    console.error("Error processing transfer:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
