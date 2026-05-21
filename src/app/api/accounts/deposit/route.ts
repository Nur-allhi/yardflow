import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const { account_id, amount, note } = body;

    if (!account_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "account_id and amount (positive number) are required" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, account_id),
            eq(accounts.organization_id, orgId),
            eq(accounts.is_active, true),
            sql`${accounts.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!account) {
        throw new Error("Account not found or inactive");
      }

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: account_id,
        type: "credit",
        amount: String(amount),
        reference_type: "other",
        transaction_date: new Date(),
        note: note || "Owner deposit",
      });

      const [updatedAccount] = await tx
        .update(accounts)
        .set({
          current_balance: String(Number(account.current_balance) + amount),
          updated_at: sql`NOW()`,
        })
        .where(eq(accounts.id, account_id))
        .returning();

      return {
        ...updatedAccount,
        current_balance: Number(updatedAccount.current_balance),
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process deposit";
    const status = message.includes("not found") ? 400 : 500;
    console.error("Error processing deposit:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
