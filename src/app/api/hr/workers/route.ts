import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workers, salaryAdvances } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { workerSchema } from "@/lib/validations/schemas";

export async function GET() {
  const orgId = await requireOrg();

  const workersList = await db
    .select({
      id: workers.id,
      name: workers.name,
      phone: workers.phone,
      designation: workers.designation,
      monthly_salary: workers.monthly_salary,
      is_active: workers.is_active,
    })
    .from(workers)
    .where(
      and(
        eq(workers.organization_id, orgId),
        sql`${workers.deleted_at} IS NULL`,
      ),
    )
    .orderBy(workers.name);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const advanceTotals = await db
    .select({
      worker_id: salaryAdvances.worker_id,
      total: sql<string>`COALESCE(SUM(${salaryAdvances.amount}), 0)`,
    })
    .from(salaryAdvances)
    .where(
      and(
        eq(salaryAdvances.organization_id, orgId),
        eq(salaryAdvances.month, currentMonth),
        eq(salaryAdvances.year, currentYear),
        sql`${salaryAdvances.deleted_at} IS NULL`,
      ),
    )
    .groupBy(salaryAdvances.worker_id);

  const advanceMap = new Map(
    advanceTotals.map((a) => [a.worker_id, Number(a.total)]),
  );

  const totalWorkers = workersList.length;
  const monthlyPayroll = workersList.reduce(
    (sum, w) => sum + Number(w.monthly_salary),
    0,
  );
  const pendingAdvances = [...advanceMap.values()].reduce(
    (s, v) => s + v,
    0,
  );

  return NextResponse.json({
    workers: workersList.map((w) => ({
      ...w,
      monthly_salary: Number(w.monthly_salary),
      this_month_advances: advanceMap.get(w.id) ?? 0,
    })),
    summary: {
      total_workers: totalWorkers,
      monthly_payroll: monthlyPayroll,
      pending_advances: pendingAdvances,
    },
  });
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = workerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [worker] = await db
      .insert(workers)
      .values({
        organization_id: orgId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        designation: parsed.data.designation || null,
        monthly_salary: parsed.data.monthly_salary.toFixed(2),
        join_date: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        ...worker,
        monthly_salary: Number(worker.monthly_salary),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating worker:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 },
    );
  }
}
