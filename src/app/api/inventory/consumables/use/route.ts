import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumablesLog, consumptionLogs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";

const useSchema = z.object({
  consumable_id: z.string().uuid("Invalid consumable"),
  quantity: z.number().positive("Quantity must be positive"),
  used_at: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = useSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [consumable] = await tx
        .select({ id: consumablesLog.id, stock_quantity: consumablesLog.stock_quantity })
        .from(consumablesLog)
        .where(
          and(
            eq(consumablesLog.id, parsed.data.consumable_id),
            eq(consumablesLog.organization_id, orgId),
            sql`${consumablesLog.deleted_at} IS NULL`,
          ),
        )
        .limit(1);

      if (!consumable) {
        throw new Error("Consumable not found");
      }

      const currentStock = Number(consumable.stock_quantity ?? "0");
      const useQty = parsed.data.quantity;

      if (currentStock < useQty) {
        throw new Error(
          `Insufficient stock. Available: ${currentStock}, requested: ${useQty}`,
        );
      }

      await tx
        .update(consumablesLog)
        .set({
          stock_quantity: sql`${consumablesLog.stock_quantity} - ${String(useQty)}`,
          updated_at: new Date(),
        })
        .where(eq(consumablesLog.id, consumable.id));

      const [log] = await tx
        .insert(consumptionLogs)
        .values({
          organization_id: orgId,
          consumable_id: parsed.data.consumable_id,
          quantity: String(useQty),
          used_at: new Date(parsed.data.used_at),
          note: parsed.data.note || null,
        })
        .returning();

      return log;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record consumption";
    const status = message.startsWith("Insufficient") || message.includes("not found") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
