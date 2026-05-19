import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workers, salaryAdvances } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { z } from "zod";

const workerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  monthly_salary: z.number().positive().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [worker] = await db
    .select({
      id: workers.id,
      name: workers.name,
      phone: workers.phone,
      designation: workers.designation,
      monthly_salary: workers.monthly_salary,
      is_active: workers.is_active,
      join_date: workers.join_date,
    })
    .from(workers)
    .where(
      and(
        eq(workers.id, id),
        eq(workers.organization_id, orgId),
        sql`${workers.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  const advances = await db
    .select({
      id: salaryAdvances.id,
      amount: salaryAdvances.amount,
      account_id: salaryAdvances.account_id,
      advance_date: salaryAdvances.advance_date,
      month: salaryAdvances.month,
      year: salaryAdvances.year,
      note: salaryAdvances.note,
    })
    .from(salaryAdvances)
    .where(
      and(
        eq(salaryAdvances.worker_id, id),
        eq(salaryAdvances.organization_id, orgId),
        sql`${salaryAdvances.deleted_at} IS NULL`,
      ),
    )
    .orderBy(sql`${salaryAdvances.advance_date} DESC`);

  return NextResponse.json({
    worker: {
      ...worker,
      monthly_salary: Number(worker.monthly_salary),
    },
    advances: advances.map((a) => ({
      ...a,
      amount: Number(a.amount),
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
    const parsed = workerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { updated_at: sql`NOW()` };
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.designation !== undefined)
      updateData.designation = parsed.data.designation;
    if (parsed.data.monthly_salary !== undefined)
      updateData.monthly_salary = parsed.data.monthly_salary.toFixed(2);
    if (parsed.data.is_active !== undefined)
      updateData.is_active = parsed.data.is_active;

    const [updated] = await db
      .update(workers)
      .set(updateData)
      .where(
        and(
          eq(workers.id, id),
          eq(workers.organization_id, orgId),
          sql`${workers.deleted_at} IS NULL`,
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      monthly_salary: Number(updated.monthly_salary),
    });
  } catch (error) {
    console.error("Error updating worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  try {
    const [deleted] = await db
      .update(workers)
      .set({ deleted_at: sql`NOW()`, updated_at: sql`NOW()` })
      .where(
        and(
          eq(workers.id, id),
          eq(workers.organization_id, orgId),
          sql`${workers.deleted_at} IS NULL`,
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 },
    );
  }
}
