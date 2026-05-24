import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryPool, inventoryMovements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

const adjustStockSchema = z.object({
  quantity_kg: z.number().finite(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession();

  try {
    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { quantity_kg, note } = parsed.data;

    if (quantity_kg === 0) {
      return NextResponse.json(
        { error: "quantity_kg must not be zero" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(inventoryPool)
        .where(eq(inventoryPool.organization_id, session.org_id))
        .limit(1);

      const currentQty = current ? Number(current.total_quantity_kg) : 0;
      const currentValue = current ? Number(current.total_value) : 0;
      const currentAvg = currentQty > 0 ? currentValue / currentQty : 0;

      const absQty = Math.abs(quantity_kg);
      const isPositive = quantity_kg > 0;
      const totalVal = absQty * currentAvg;

      let newQty: number;
      let newValue: number;

      if (isPositive) {
        newQty = currentQty + quantity_kg;
        newValue = currentValue + totalVal;
      } else {
        newQty = Math.max(0, currentQty - absQty);
        newValue = Math.max(0, currentValue - totalVal);
      }

      await tx
        .insert(inventoryPool)
        .values({
          organization_id: session.org_id,
          total_quantity_kg: String(newQty),
          total_value: String(newValue),
        })
        .onConflictDoUpdate({
          target: inventoryPool.organization_id,
          set: {
            total_quantity_kg: String(newQty),
            total_value: String(newValue),
          },
        });

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          organization_id: session.org_id,
          movement_type: isPositive ? "in" : "out",
          quantity_kg: String(absQty),
          price_per_kg: currentAvg > 0 ? String(currentAvg) : null,
          total_value: totalVal > 0 ? String(totalVal) : null,
          reference_type: "adjustment",
          description: note || null,
          movement_date: new Date(),
          note: note || null,
        })
        .returning();

      return {
        previousQty: currentQty,
        previousValue: currentValue,
        newQty,
        newValue,
        movement,
      };
    });

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "adjust",
      entityType: "inventory_pool",
      entityId: session.org_id,
      description: `Stock ${quantity_kg > 0 ? "increased" : "decreased"} by ${Math.abs(quantity_kg)} kg`,
      changes: {
        previous_quantity_kg: result.previousQty,
        previous_value: result.previousValue,
        new_quantity_kg: result.newQty,
        new_value: result.newValue,
        quantity_change: quantity_kg,
      },
    });

    return NextResponse.json({
      total_quantity_kg: result.newQty,
      total_value: result.newValue,
      avg_price_per_kg: result.newQty > 0 ? result.newValue / result.newQty : 0,
      movement: {
        ...result.movement,
        quantity_kg: Number(result.movement.quantity_kg),
        price_per_kg: result.movement.price_per_kg
          ? Number(result.movement.price_per_kg)
          : null,
        total_value: result.movement.total_value
          ? Number(result.movement.total_value)
          : null,
      },
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 },
    );
  }
}
