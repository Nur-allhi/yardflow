import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accountTransactions, purchaseItems, purchasePayments, purchaseOtherExpenses,
  saleItems, salePayments, stockLedger, scrapPool, consumptionLogs,
  salaryPayments, salaryAdvances, activityLogs, periodReports,
  simplePurchaseItems, simplePurchasePayments, simplePurchaseOtherExpenses,
  simpleSaleItems, simpleSalePayments, inventoryMovements,
  purchases, sales, consumablesLog, simplePurchases, simpleSales,
  accounts, materialSubtypes, vendors, customers, workers,
  materialCategories, inventoryPool, users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;
  const userId = session.user_id;

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    const [user] = await db
      .select({ password_hash: users.password_hash })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.organization_id, orgId)))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(accountTransactions).where(eq(accountTransactions.organization_id, orgId));
      await tx.delete(purchaseItems).where(eq(purchaseItems.organization_id, orgId));
      await tx.delete(purchasePayments).where(eq(purchasePayments.organization_id, orgId));
      await tx.delete(purchaseOtherExpenses).where(eq(purchaseOtherExpenses.organization_id, orgId));
      await tx.delete(saleItems).where(eq(saleItems.organization_id, orgId));
      await tx.delete(salePayments).where(eq(salePayments.organization_id, orgId));
      await tx.delete(stockLedger).where(eq(stockLedger.organization_id, orgId));
      await tx.delete(scrapPool).where(eq(scrapPool.organization_id, orgId));
      await tx.delete(consumptionLogs).where(eq(consumptionLogs.organization_id, orgId));
      await tx.delete(salaryPayments).where(eq(salaryPayments.organization_id, orgId));
      await tx.delete(salaryAdvances).where(eq(salaryAdvances.organization_id, orgId));
      await tx.delete(activityLogs).where(eq(activityLogs.organization_id, orgId));
      await tx.delete(periodReports).where(eq(periodReports.organization_id, orgId));

      await tx.delete(simplePurchaseItems).where(eq(simplePurchaseItems.organization_id, orgId));
      await tx.delete(simplePurchasePayments).where(eq(simplePurchasePayments.organization_id, orgId));
      await tx.delete(simplePurchaseOtherExpenses).where(eq(simplePurchaseOtherExpenses.organization_id, orgId));
      await tx.delete(simpleSaleItems).where(eq(simpleSaleItems.organization_id, orgId));
      await tx.delete(simpleSalePayments).where(eq(simpleSalePayments.organization_id, orgId));
      await tx.delete(inventoryMovements).where(eq(inventoryMovements.organization_id, orgId));
      await tx.delete(purchases).where(eq(purchases.organization_id, orgId));
      await tx.delete(sales).where(eq(sales.organization_id, orgId));
      await tx.delete(consumablesLog).where(eq(consumablesLog.organization_id, orgId));
      await tx.delete(simplePurchases).where(eq(simplePurchases.organization_id, orgId));
      await tx.delete(simpleSales).where(eq(simpleSales.organization_id, orgId));
      await tx.delete(accounts).where(eq(accounts.organization_id, orgId));
      await tx.delete(materialSubtypes).where(eq(materialSubtypes.organization_id, orgId));
      await tx.delete(vendors).where(eq(vendors.organization_id, orgId));
      await tx.delete(customers).where(eq(customers.organization_id, orgId));
      await tx.delete(workers).where(eq(workers.organization_id, orgId));
      await tx.delete(materialCategories).where(eq(materialCategories.organization_id, orgId));
      await tx.delete(inventoryPool).where(eq(inventoryPool.organization_id, orgId));
    });

    logActivity({
      orgId,
      userId,
      action: "erase",
      entityType: "organization",
      entityId: orgId,
      description: "Erased all organization data",
    });

    return NextResponse.json({
      success: true,
      message: "All data erased successfully",
    });
  } catch (error) {
    console.error("Error erasing data:", error);
    return NextResponse.json(
      { error: "Failed to erase data" },
      { status: 500 },
    );
  }
}
