import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workers,
  salaryAdvances,
  salaryPayments,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : now.getMonth() + 1;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : now.getFullYear();

  const activeWorkers = await db
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
        eq(workers.is_active, true),
        sql`${workers.deleted_at} IS NULL`,
      ),
    )
    .orderBy(workers.name);

  const workerIds = activeWorkers.map((w) => w.id);

  let advanceTotals: { worker_id: string; total: string }[] = [];
  if (workerIds.length > 0) {
    advanceTotals = await db
      .select({
        worker_id: salaryAdvances.worker_id,
        total: sql<string>`COALESCE(SUM(${salaryAdvances.amount}), 0)`,
      })
      .from(salaryAdvances)
      .where(
        and(
          eq(salaryAdvances.organization_id, orgId),
          eq(salaryAdvances.month, month),
          eq(salaryAdvances.year, year),
          sql`${salaryAdvances.deleted_at} IS NULL`,
          sql`${salaryAdvances.worker_id} = ANY(ARRAY[${sql.join(
            workerIds.map((id) => sql`${id}::uuid`),
            sql`,`,
          )}])`,
        ),
      )
      .groupBy(salaryAdvances.worker_id);
  }

  const advanceMap = new Map(
    advanceTotals.map((a) => [a.worker_id, Number(a.total)]),
  );

  let existingPayments: {
    worker_id: string;
    id: string;
    paid_amount: string;
    status: string;
  }[] = [];
  if (workerIds.length > 0) {
    existingPayments = await db
      .select({
        worker_id: salaryPayments.worker_id,
        id: salaryPayments.id,
        paid_amount: salaryPayments.paid_amount,
        status: salaryPayments.status,
      })
      .from(salaryPayments)
      .where(
        and(
          eq(salaryPayments.organization_id, orgId),
          eq(salaryPayments.month, month),
          eq(salaryPayments.year, year),
          sql`${salaryPayments.deleted_at} IS NULL`,
          sql`${salaryPayments.worker_id} = ANY(ARRAY[${sql.join(
            workerIds.map((id) => sql`${id}::uuid`),
            sql`,`,
          )}])`,
        ),
      );
  }

  const paymentMap = new Map(
    existingPayments.map((p) => [p.worker_id, p]),
  );

  let totalSalary = 0;
  let totalAdvancesSum = 0;
  let totalPayable = 0;

  const payrollWorkers = activeWorkers.map((w) => {
    const baseSalary = Number(w.monthly_salary);
    const totalAdv = advanceMap.get(w.id) ?? 0;
    const netPayable = baseSalary - totalAdv;
    const payment = paymentMap.get(w.id);

    totalSalary += baseSalary;
    totalAdvancesSum += totalAdv;
    totalPayable += netPayable;

    return {
      worker_id: w.id,
      worker_name: w.name,
      phone: w.phone,
      designation: w.designation,
      base_salary: baseSalary,
      advances_taken: totalAdv,
      net_payable: netPayable,
      paid_amount: payment ? Number(payment.paid_amount) : 0,
      status: payment ? payment.status : "pending",
    };
  });

  return NextResponse.json({
    workers: payrollWorkers,
    summary: {
      month,
      year,
      total_salary: totalSalary,
      total_advances: totalAdvancesSum,
      total_payable: totalPayable,
    },
  });
}
