import Link from "next/link";

interface InventoryNavProps {
  active: string;
}

const navItems = [
  { href: "/inventory", label: "Stock Overview", key: "overview" },
  { href: "/inventory/categories", label: "Categories", key: "categories" },
  { href: "/inventory/subtypes", label: "Sub-types", key: "subtypes" },
  { href: "/inventory/ledger", label: "Ledger", key: "ledger" },
  { href: "/inventory/scrap", label: "Scrap Pool", key: "scrap" },
  { href: "/inventory/consumables", label: "Consumables", key: "consumables" },
];

export function InventoryNav({ active }: InventoryNavProps) {
  return (
    <>
      <div className="hidden md:flex items-center gap-1 mb-6 -mx-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              item.key === active
                ? "bg-[#0F172A] text-white"
                : "text-[#505f76] hover:bg-[#f2f4f6]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 hide-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              item.key === active
                ? "bg-[#0F172A] text-white"
                : "bg-[#f2f4f6] text-[#505f76]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
