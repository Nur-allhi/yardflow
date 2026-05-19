import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountTransactions } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { accountSchema } from "@/lib/validations/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.organization_id, orgId),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const transactions = await db
    .select()
    .from(accountTransactions)
    .where(
      and(
        eq(accountTransactions.account_id, id),
        eq(accountTransactions.organization_id, orgId),
        sql`${accountTransactions.deleted_at} IS NULL`,
      ),
    )
    .orderBy(desc(accountTransactions.transaction_date))
    .limit(50);

  return NextResponse.json({
    ...account,
    current_balance: Number(account.current_balance),
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = accountSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.organization_id, orgId),
          sql`${accounts.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(accounts)
      .set({
        ...parsed.data,
        bank_name: parsed.data.bank_name ?? undefined,
        account_number: parsed.data.account_number ?? undefined,
        updated_at: sql`NOW()`,
      })
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.organization_id, orgId),
        ),
      )
      .returning();

    return NextResponse.json({
      ...updated,
      current_balance: Number(updated.current_balance),
    });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [existing] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.organization_id, orgId),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await db
    .update(accounts)
    .set({ deleted_at: sql`NOW()` })
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.organization_id, orgId),
      ),
    );

  return NextResponse.json({ success: true });
}
