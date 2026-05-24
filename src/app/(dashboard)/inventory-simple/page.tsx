import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { InventorySimpleNav } from "@/components/InventorySimpleNav";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { inventoryPool, inventoryMovements } from "@/lib/db/schema";

function formatTk(amount: number): string {
  return amount.toLocaleString("en-IN") + " tk";
}

function formatKg(kg: number): string {
  return kg.toFixed(3) + " kg";
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function InventorySimplePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgId = session.org_id;

  const [pool] = await db
    .select()
    .from(inventoryPool)
    .where(eq(inventoryPool.organization_id, orgId))
    .limit(1);

  const movements = await db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.organization_id, orgId))
    .orderBy(desc(inventoryMovements.movement_date))
    .limit(10);

  const totalKg = Number(pool?.total_quantity_kg ?? 0);
  const avgPrice = Number(pool?.avg_price_per_kg ?? 0);
  const totalValue = Number(pool?.total_value ?? 0);

  return (
    <div className="p-4 md:p-8">
      <div className="hidden md:block">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Inventory", href: null },
          ]}
        />
        <h1 className="font-display text-[2rem] font-bold text-primary-container tracking-tight">
          Inventory
        </h1>
      </div>

      <InventorySimpleNav active="overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary-container p-6 rounded-xl text-white">
          <p className="text-sm font-medium opacity-80">Total Stock</p>
          <p className="text-3xl font-mono font-bold mt-2">{formatKg(totalKg)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-secondary">Average Price</p>
          <p className="text-3xl font-mono font-bold mt-2 text-primary-container">
            {formatTk(avgPrice)}
            <span className="text-sm font-normal text-secondary ml-1">/kg</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-secondary">Total Value</p>
          <p className="text-3xl font-mono font-bold mt-2 text-primary-container">
            {formatTk(totalValue)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold text-primary-container mb-4">
          Recent Movements
        </h2>
        {movements.length === 0 ? (
          <div className="bg-white rounded-lg border border-outline-variant/30 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary block mb-4">
              swap_vert
            </span>
            <p className="text-lg font-medium text-secondary mb-1">No movements yet</p>
            <p className="text-sm text-secondary">Movements will appear here once inventory is recorded</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Price/kg</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {movements.map((m) => {
                  const qty = Number(m.quantity_kg);
                  const price = m.price_per_kg ? Number(m.price_per_kg) : 0;
                  const total = m.total_value ? Number(m.total_value) : qty * price;
                  return (
                    <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-secondary">
                        {formatDate(m.movement_date)}
                      </td>
                      <td className="px-4 py-4">
                        {m.movement_type === "in" ? (
                          <span className="bg-success/10 text-success px-2 py-0.5 rounded text-xs font-bold uppercase">
                            In
                          </span>
                        ) : (
                          <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs font-bold uppercase">
                            Out
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">
                        <span className={m.movement_type === "in" ? "text-success" : "text-error"}>
                          {m.movement_type === "in" ? "+" : "-"}{formatKg(qty)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-secondary">
                        {price > 0 ? formatTk(price) : "—"}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm font-semibold text-primary-container">
                        {formatTk(total)}
                      </td>
                      <td className="px-4 py-4 text-xs text-secondary italic max-w-[200px] truncate">
                        {m.note || m.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
