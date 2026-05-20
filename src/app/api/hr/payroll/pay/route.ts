import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workers,
  salaryAdvances,
  salaryPayments,
  accountTransactions,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { salaryPaymentSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = salaryPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [worker] = await tx
        .select({ monthly_salary: workers.monthly_salary })
        .from(workers)
        .where(
          and(
            eq(workers.id, parsed.data.worker_id),
            eq(workers.organization_id, orgId),
            sql`${workers.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!worker) {
        throw new Error("Worker not found");
      }

      const [advanceSum] = await tx
        .select({
          total: sql<string>`COALESCE(SUM(${salaryAdvances.amount}), 0)`,
        })
        .from(salaryAdvances)
        .where(
          and(
            eq(salaryAdvances.worker_id, parsed.data.worker_id),
            eq(salaryAdvances.organization_id, orgId),
            eq(salaryAdvances.month, parsed.data.month),
            eq(salaryAdvances.year, parsed.data.year),
            sql`${salaryAdvances.deleted_at} IS NULL`,
          ),
        );

      const baseSalary = Number(worker.monthly_salary);
      const totalAdvances = Number(advanceSum?.total ?? 0);
      const netPayable = baseSalary - totalAdvances;

      const [existingPayment] = await tx
        .select()
        .from(salaryPayments)
        .where(
          and(
            eq(salaryPayments.worker_id, parsed.data.worker_id),
            eq(salaryPayments.organization_id, orgId),
            eq(salaryPayments.month, parsed.data.month),
            eq(salaryPayments.year, parsed.data.year),
            sql`${salaryPayments.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      let payment: typeof salaryPayments.$inferSelect;

      if (existingPayment) {
        const newPaidAmount =
          Number(existingPayment.paid_amount) + parsed.data.paid_amount;
        const newStatus =
          newPaidAmount >= netPayable ? "paid" : newPaidAmount > 0 ? "partial" : "pending";

        [payment] = await tx
          .update(salaryPayments)
          .set({
            paid_amount: newPaidAmount.toFixed(2),
            status: newStatus,
            account_id: parsed.data.account_id,
            payment_date: new Date(parsed.data.payment_date),
            updated_at: sql`NOW()`,
          })
          .where(
            and(
              eq(salaryPayments.id, existingPayment.id),
              eq(salaryPayments.organization_id, orgId),
            ),
          )
          .returning();
      } else {
        const status =
          parsed.data.paid_amount >= netPayable ? "paid" : "partial";

        [payment] = await tx
          .insert(salaryPayments)
          .values({
            organization_id: orgId,
            worker_id: parsed.data.worker_id,
            month: parsed.data.month,
            year: parsed.data.year,
            base_salary: baseSalary.toFixed(2),
            total_advances: totalAdvances.toFixed(2),
            paid_amount: parsed.data.paid_amount.toFixed(2),
            account_id: parsed.data.account_id,
            payment_date: new Date(parsed.data.payment_date),
            status,
          })
          .returning();
      }

      await tx.insert(accountTransactions).values({
        organization_id: orgId,
        account_id: parsed.data.account_id,
        type: "debit",
        amount: parsed.data.paid_amount.toFixed(2),
        reference_type: "salary",
        reference_id: payment.id,
        transaction_date: new Date(parsed.data.payment_date),
        note: `Salary payment for ${parsed.data.month}/${parsed.data.year}`,
      });

      return payment;
    });

    return NextResponse.json(
      {
        ...result,
        base_salary: Number(result.base_salary),
        total_advances: Number(result.total_advances),
        net_payable: Number(result.net_payable),
        paid_amount: Number(result.paid_amount),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing salary payment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process salary payment";
    const status = message === "Worker not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
