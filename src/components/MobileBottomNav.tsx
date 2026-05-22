"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { springSnap } from "@/lib/animation";

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
    <motion.nav className="fixed bottom-0 w-full md:hidden z-50 bg-white border-t border-outline-variant shadow-lg">
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-16 px-2 relative">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.92 }} className="relative">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 min-w-[60px] snap-start min-h-[56px] py-2 focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 rounded-lg ${
                  active ? "text-primary-container" : "text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-xl relative z-10">{item.icon}</span>
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </Link>
              {active && (
                <motion.div
                  className="absolute inset-1 rounded-lg bg-primary-container/10 -z-0"
                  layoutId="active-tab"
                  transition={springSnap}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}
