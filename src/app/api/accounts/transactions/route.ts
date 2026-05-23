import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountTransactions } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { enrichTransactions } from "@/lib/accounts";

export async function GET(request: Request) {
  const orgId = await requireOrg();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

  const rows = await db
    .select({
      id: accountTransactions.id,
      account_id: accountTransactions.account_id,
      type: accountTransactions.type,
      amount: accountTransactions.amount,
      reference_type: accountTransactions.reference_type,
      reference_id: accountTransactions.reference_id,
      note: accountTransactions.note,
      transaction_date: accountTransactions.transaction_date,
      account_name: accounts.name,
    })
    .from(accountTransactions)
    .innerJoin(accounts, eq(accountTransactions.account_id, accounts.id))
    .where(
      and(
        eq(accountTransactions.organization_id, orgId),
        eq(accounts.organization_id, orgId),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .orderBy(desc(accountTransactions.transaction_date), desc(accountTransactions.created_at))
    .limit(limit);

  const enriched = await enrichTransactions(rows);

  return NextResponse.json(
    rows.map((r, i) => ({
      ...r,
      amount: Number(r.amount),
      transaction_date: r.transaction_date,
      reference_name: enriched[i].reference_name,
      reference_url: enriched[i].reference_url,
    })),
  );
}
