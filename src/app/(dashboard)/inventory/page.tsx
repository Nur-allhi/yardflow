import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InventoryClient } from "./InventoryClient";
import { InventoryNav } from "@/components/InventoryNav";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgId = session.org_id;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/inventory/stock`,
    { headers: { "x-org-id": orgId } },
  );
  const data = res.ok ? await res.json() : null;

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumbs and Header */}
      <div className="hidden md:flex justify-between items-end mb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
            <Link href="/" className="hover:text-[#0F172A]">
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-xs">
              chevron_right
            </span>
            <span className="text-[#0F172A] font-bold">Inventory</span>
          </nav>
          <h1 className="font-display text-3xl font-bold text-[#0F172A] tracking-tight">
            Stock Overview
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/inventory/categories"
            className="px-5 py-2.5 border border-[#0F172A] text-[#0F172A] font-semibold rounded-md hover:bg-[#0F172A]/5 transition-colors text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Category
          </Link>
          <Link
            href="/inventory/subtypes"
            className="px-5 py-2.5 bg-[#0F172A] text-white font-semibold rounded-md hover:bg-[#0F172A]/90 transition-all shadow-sm text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">playlist_add</span>
            Add Sub-type
          </Link>
        </div>
      </div>

      {/* Mobile header inline */}
      <div className="md:hidden mb-2">
        <nav className="flex items-center gap-2 text-xs text-[#505f76] font-medium tracking-wide uppercase mb-1">
          <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-[#0F172A] font-bold">Inventory</span>
        </nav>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">
          Stock Overview
        </h1>
      </div>

      <InventoryNav active="overview" />

      <InventoryClient data={data} />
    </div>
  );
}
