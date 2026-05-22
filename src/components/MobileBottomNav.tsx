"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/inventory", label: "Inventory", icon: "inventory_2" },
  { href: "/purchases", label: "Purchases", icon: "shopping_cart" },
  { href: "/sales", label: "Sales", icon: "sell" },
  { href: "/hr", label: "HR", icon: "groups" },
  { href: "/accounts", label: "Accounts", icon: "account_balance" },
  { href: "/reports", label: "Reports", icon: "assessment" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full md:hidden z-50 bg-white border-t border-outline-variant shadow-lg">
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-16 px-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 min-w-[60px] snap-start py-1 ${
                active ? "text-primary-container" : "text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
