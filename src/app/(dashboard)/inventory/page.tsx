import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { InventoryClient } from "./InventoryClient";
import { InventoryNav } from "@/components/InventoryNav";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { materialCategories, materialSubtypes, stockLedger, scrapPool } from "@/lib/db/schema";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgId = session.org_id;

  const categories = await db
    .select({
      id: materialCategories.id,
      name: materialCategories.name,
      description: materialCategories.description,
    })
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.organization_id, orgId),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .orderBy(materialCategories.name);

  const subtypes = await db
    .select({
      id: materialSubtypes.id,
      name: materialSubtypes.name,
      default_price_per_kg: materialSubtypes.default_price_per_kg,
      category_id: materialSubtypes.category_id,
      is_active: materialSubtypes.is_active,
    })
    .from(materialSubtypes)
    .where(
      and(
        eq(materialSubtypes.organization_id, orgId),
        sql`${materialSubtypes.deleted_at} IS NULL`,
        eq(materialSubtypes.is_active, true),
      ),
    );

  const stockLedgerData = await db
    .select({
      subtype_id: stockLedger.subtype_id,
      movement_type: stockLedger.movement_type,
      quantity_kg: stockLedger.quantity_kg,
      price_per_kg: stockLedger.price_per_kg,
      total_value: stockLedger.total_value,
    })
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.organization_id, orgId),
        sql`${stockLedger.deleted_at} IS NULL`,
      ),
    );

  const stockMap = new Map<string, { qty: number; value: number }>();
  for (const row of stockLedgerData) {
    const qty = Number(row.quantity_kg);
    const val = Number(row.total_value) || qty * Number(row.price_per_kg || 0);
    const prev = stockMap.get(row.subtype_id) || { qty: 0, value: 0 };
    stockMap.set(row.subtype_id, {
      qty: row.movement_type === "in" ? prev.qty + qty : prev.qty - qty,
      value: row.movement_type === "in" ? prev.value + val : prev.value - val,
    });
  }

  const [scrapResult] = await db
    .select({
      scrap_kg: sql<string>`COALESCE(SUM(CASE WHEN ${scrapPool.movement_type} = 'in' THEN ${scrapPool.quantity_kg}::numeric ELSE -${scrapPool.quantity_kg}::numeric END), 0)`,
    })
    .from(scrapPool)
    .where(
      and(
        eq(scrapPool.organization_id, orgId),
        sql`${scrapPool.deleted_at} IS NULL`,
      ),
    );

  const categoryMap = new Map(categories.map((c) => [c.id, { ...c, subtypes: [] as { id: string; name: string; current_stock_kg: number; wac: number; default_price_per_kg: string | null; created_at: string }[], total_weight: 0, total_value: 0 }]));
  let totalStockKg = 0;
  let totalStockValue = 0;

  for (const st of subtypes) {
    const stock = stockMap.get(st.id) || { qty: 0, value: 0 };
    const wac = stock.qty > 0 ? stock.value / stock.qty : 0;
    const cat = categoryMap.get(st.category_id);
    if (cat) {
      cat.subtypes.push({
        id: st.id,
        name: st.name,
        current_stock_kg: stock.qty,
        wac,
        default_price_per_kg: st.default_price_per_kg,
        created_at: "",
      });
      totalStockKg += stock.qty;
      totalStockValue += stock.value;
      cat.total_weight = (cat.total_weight || 0) + stock.qty;
      cat.total_value = (cat.total_value || 0) + stock.value;
    }
  }

  const data = {
    categories: Array.from(categoryMap.values()),
    total_stock_kg: totalStockKg,
    total_stock_value: totalStockValue,
    scrap_pool_kg: Number(scrapResult?.scrap_kg ?? 0),
  };

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumbs and Header */}
      <div className="hidden md:flex justify-between items-end mb-6">
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: null }]} />
          <h1 className="font-display text-[2rem] font-bold text-primary-container tracking-tight">
            Inventory
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/inventory/categories"
            className="px-4 py-2 border border-outline-variant text-primary-container font-medium rounded-lg hover:bg-surface-container-low transition-all text-sm"
          >
            Categories
          </Link>
          <Link
            href="/inventory/subtypes"
            className="px-4 py-2 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm"
          >
            + Sub-type
          </Link>
        </div>
      </div>

      {/* Inventory Sub-navigation (visible on all screen sizes) */}
      <InventoryNav active="overview" />

      <InventoryClient data={data} />
    </div>
  );
}
