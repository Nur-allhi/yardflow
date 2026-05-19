import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accountTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { accountSchema } from "@/lib/validations/schemas";

export async function GET(_request: Request) {
  const orgId = await requireOrg();

  const result = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organization_id, orgId),
        eq(accounts.is_active, true),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .orderBy(accounts.name);

  return NextResponse.json(
    result.map((a) => ({ ...a, current_balance: Number(a.current_balance) })),
  );
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, type, bank_name, account_number, opening_balance } =
      parsed.data;

    const result = await db.transaction(async (tx) => {
      const [account] = await tx
        .insert(accounts)
        .values({
          organization_id: orgId,
          name,
          type,
          bank_name: bank_name || null,
          account_number: account_number || null,
          current_balance: opening_balance ? String(opening_balance) : "0",
        })
        .returning();

      if (opening_balance && opening_balance > 0) {
        await tx.insert(accountTransactions).values({
          organization_id: orgId,
          account_id: account.id,
          type: "credit",
          amount: String(opening_balance),
          reference_type: "other",
          reference_id: account.id,
          transaction_date: sql`NOW()`,
          note: "Opening balance",
        });
      }

      return account;
    });

    return NextResponse.json(
      { ...result, current_balance: Number(result.current_balance) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
