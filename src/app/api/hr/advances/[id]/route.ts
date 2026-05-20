import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  salaryAdvances,
  workers,
  accountTransactions,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { z } from "zod";

const updateAdvanceSchema = z.object({
  note: z.string().optional(),
  advance_date: z.string().min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const orgId = await requireOrg();
  const { id } = await params;

  const [advance] = await db
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
    .where(
      and(
        eq(salaryAdvances.id, id),
        eq(salaryAdvances.organization_id, orgId),
        sql`${salaryAdvances.deleted_at} IS NULL`,
      ),
    );

  if (!advance) {
    return NextResponse.json(
      { error: "Advance not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...advance,
    amount: Number(advance.amount),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const orgId = await requireOrg();
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateAdvanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(salaryAdvances)
        .where(
          and(
            eq(salaryAdvances.id, id),
            eq(salaryAdvances.organization_id, orgId),
            sql`${salaryAdvances.deleted_at} IS NULL`,
          ),
        );

      if (!existing) {
        throw new Error("Advance not found");
      }

      const updateData: Record<string, unknown> = {
        note: parsed.data.note || null,
        advance_date: new Date(parsed.data.advance_date),
        updated_at: new Date(),
      };

      const [updated] = await tx
        .update(salaryAdvances)
        .set(updateData)
        .where(eq(salaryAdvances.id, id))
        .returning();

      await tx
        .update(accountTransactions)
        .set({
          transaction_date: new Date(parsed.data.advance_date),
          note: parsed.data.note || null,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(accountTransactions.reference_type, "salary"),
            eq(accountTransactions.reference_id, id),
            eq(accountTransactions.organization_id, orgId),
            sql`${accountTransactions.deleted_at} IS NULL`,
          ),
        );

      return updated;
    });

    return NextResponse.json({
      ...result,
      amount: Number(result.amount),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update advance";
    if (message === "Advance not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("Error updating advance:", error);
    return NextResponse.json(
      { error: "Failed to update advance" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const orgId = await requireOrg();
  const { id } = await params;

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(salaryAdvances)
        .where(
          and(
            eq(salaryAdvances.id, id),
            eq(salaryAdvances.organization_id, orgId),
            sql`${salaryAdvances.deleted_at} IS NULL`,
          ),
        );

      if (!existing) {
        throw new Error("Advance not found");
      }

      await tx
        .update(salaryAdvances)
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where(eq(salaryAdvances.id, id));

      await tx
        .delete(accountTransactions)
        .where(
          and(
            eq(accountTransactions.reference_type, "salary"),
            eq(accountTransactions.reference_id, id),
          ),
        );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete advance";
    if (message === "Advance not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("Error deleting advance:", error);
    return NextResponse.json(
      { error: "Failed to delete advance" },
      { status: 500 },
    );
  }
}
