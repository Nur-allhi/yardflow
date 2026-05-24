import Link from "next/link";

interface InventorySimpleNavProps {
  active: string;
}

const navItems = [
  { href: "/inventory-simple", label: "Overview", key: "overview" },
  { href: "/inventory-simple/ledger", label: "Ledger", key: "ledger" },
  { href: "/inventory-simple/scrap", label: "Scrap Pool", key: "scrap" },
  { href: "/inventory-simple/consumables", label: "Consumables", key: "consumables" },
];

export function InventorySimpleNav({ active }: InventorySimpleNavProps) {
  return (
    <>
      <div className="hidden md:flex items-center gap-1 mb-6 -mx-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              item.key === active
                ? "bg-primary-container text-white"
                : "text-secondary hover:bg-surface-container-low"
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
            className={`px-4 py-2.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              item.key === active
                ? "bg-primary-container text-white"
                : "bg-surface-container-low text-secondary"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
