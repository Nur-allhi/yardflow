import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapPool, sales, saleItems } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const session = await requireSession();

  try {
    const body = await request.json();
    const { quantity_kg, movement_date, note } = body;

    if (!quantity_kg || quantity_kg <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    const [entry] = await db
      .insert(scrapPool)
      .values({
        organization_id: session.org_id,
        movement_type: "in",
        quantity_kg: String(quantity_kg),
        movement_date: movement_date ? new Date(movement_date) : new Date(),
        note: note || "Manual addition",
      })
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "scrap",
      entityId: entry.id,
      description: `Recorded ${entry.quantity_kg} kg scrap`,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error adding scrap:", error);
    return NextResponse.json({ error: "Failed to add scrap" }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireSession();

  try {
    const movements = await db
      .select({
        id: scrapPool.id,
        movement_type: scrapPool.movement_type,
        quantity_kg: scrapPool.quantity_kg,
        reference_id: scrapPool.reference_id,
        movement_date: scrapPool.movement_date,
        note: scrapPool.note,
        created_at: scrapPool.created_at,
      })
      .from(scrapPool)
      .where(
        and(
          eq(scrapPool.organization_id, session.org_id),
          isNull(scrapPool.deleted_at),
        ),
      )
      .orderBy(desc(scrapPool.movement_date));

    const scrapQty = movements.reduce((sum, m) => {
      const qty = Number(m.quantity_kg);
      return m.movement_type === "in" ? sum + qty : sum - qty;
    }, 0);

    let currentKg = 0;
    const enriched = movements.map((m) => {
      const qty = Number(m.quantity_kg);
      if (m.movement_type === "in") currentKg += qty;
      else currentKg -= qty;
      return {
        ...m,
        quantity_kg: qty,
        movement_date: m.movement_date.toISOString().split("T")[0],
        balance: currentKg,
      };
    });

    const lastSale = await db
      .select({
        id: sales.id,
        sale_date: sales.sale_date,
        total_amount: sales.total_amount,
        note: sales.note,
      })
      .from(sales)
      .where(
        and(
          eq(sales.organization_id, session.org_id),
          eq(sales.sale_type, "scrap"),
          isNull(sales.deleted_at),
        ),
      )
      .orderBy(desc(sales.sale_date))
      .limit(1);

    let daysSinceLastSale: number | null = null;
    let lastSaleKg = 0;
    if (lastSale.length > 0) {
      const diff =
        new Date().getTime() - new Date(lastSale[0].sale_date).getTime();
      daysSinceLastSale = Math.floor(diff / (1000 * 60 * 60 * 24));

      const items = await db
        .select({ quantity_kg: saleItems.quantity_kg })
        .from(saleItems)
        .where(
          and(
            eq(saleItems.sale_id, lastSale[0].id),
            isNull(saleItems.deleted_at),
          ),
        )
        .limit(1);
      lastSaleKg = items.length > 0 ? Number(items[0].quantity_kg) : 0;
    }

    const estimatedPricePerKg = 50;
    const estimatedValue = scrapQty * estimatedPricePerKg;

    return NextResponse.json({
      current_kg: Math.max(0, scrapQty),
      estimated_value: estimatedValue,
      estimated_price_per_kg: estimatedPricePerKg,
      days_since_last_sale: daysSinceLastSale,
      last_sale_kg: lastSaleKg,
      last_sale_date: lastSale.length > 0 ? lastSale[0].sale_date : null,
      movements: enriched,
    });
  } catch (error) {
    console.error("Error fetching scrap pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrap pool data" },
      { status: 500 },
    );
  }
}
