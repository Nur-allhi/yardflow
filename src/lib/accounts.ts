import { db } from "@/lib/db";
import { accountTransactions, accounts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface RecordAccountTransactionParams {
  organization_id: string;
  account_id: string;
  type: "credit" | "debit";
  amount: string;
  reference_type: "purchase_payment" | "sale_payment" | "salary" | "advance" | "transfer" | "other";
  reference_id?: string;
  note?: string | null;
  transaction_date: Date;
}

export async function recordAccountTransaction(params: RecordAccountTransactionParams) {
  return db.transaction(async (tx) => {
    const [txn] = await tx
      .insert(accountTransactions)
      .values({
        organization_id: params.organization_id,
        account_id: params.account_id,
        type: params.type,
        amount: params.amount,
        reference_type: params.reference_type,
        reference_id: params.reference_id,
        note: params.note,
        transaction_date: params.transaction_date,
      })
      .returning();

    await tx
      .update(accounts)
      .set({
        current_balance: sql`(SELECT COALESCE(
          SUM(CASE WHEN type = 'credit' THEN amount::numeric ELSE 0 END) -
          SUM(CASE WHEN type = 'debit' THEN amount::numeric ELSE 0 END),
          0)
        FROM account_transactions
        WHERE account_id = ${params.account_id}
          AND deleted_at IS NULL)`,
        updated_at: sql`NOW()`,
      })
      .where(eq(accounts.id, params.account_id));

    return txn;
  });
}
