import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  salaryAdvances,
  workers,
  accountTransactions,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { advanceSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("worker_id");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const conditions = [
    eq(salaryAdvances.organization_id, orgId),
    sql`${salaryAdvances.deleted_at} IS NULL`,
  ] as (ReturnType<typeof eq> | ReturnType<typeof sql>)[];

  if (workerId) conditions.push(eq(salaryAdvances.worker_id, workerId));
  if (month) conditions.push(eq(salaryAdvances.month, parseInt(month)));
  if (year) conditions.push(eq(salaryAdvances.year, parseInt(year)));

  const advances = await db
    .select({
      id: salaryAdvances.id,
      worker_id: salaryAdvances.worker_id,
      amount: salaryAdvances.amount,
      account_id: salaryAdvances.account_id,
      advance_date: salaryAdvances.advance_date,
      month: salaryAdvances.month,
      year: salaryAdvances.year,
      note: salaryAdvances.note,
      created_at: salaryAdvances.created_at,
      worker_name: workers.name,
    })
    .from(salaryAdvances)
    .leftJoin(
      workers,
      and(
        eq(salaryAdvances.worker_id, workers.id),
        sql`${workers.deleted_at} IS NULL`,
      ),
    )
    .where(and(...conditions))
    .orderBy(sql`${salaryAdvances.advance_date} DESC`);

  return NextResponse.json(
    advances.map((a) => ({
      ...a,
      amount: Number(a.amount),
    })),
  );
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = advanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [advance] = await tx
        .insert(salaryAdvances)
        .values({
          organization_id: orgId,
          worker_id: parsed.data.worker_id,
          amount: parsed.data.amount.toFixed(2),
          account_id: parsed.data.account_id,
          advance_date: new Date(parsed.data.advance_date),
          month: parsed.data.month,
          year: parsed.data.year,
          note: parsed.data.note || null,
        })
        .returning();

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: parsed.data.account_id,
        type: "debit",
        amount: parsed.data.amount.toFixed(2),
        reference_type: "salary",
        reference_id: advance.id,
        transaction_date: new Date(parsed.data.advance_date),
        note: parsed.data.note || null,
      });

      return advance;
    });

    return NextResponse.json(
      {
        ...result,
        amount: Number(result.amount),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating advance:", error);
    return NextResponse.json(
      { error: "Failed to create advance" },
      { status: 500 },
    );
  }
}
