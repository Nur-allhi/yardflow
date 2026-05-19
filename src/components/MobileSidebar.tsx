"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/inventory", icon: "inventory_2", label: "Inventory" },
  { href: "/purchases", icon: "shopping_cart", label: "Purchases" },
  { href: "/sales", icon: "sell", label: "Sales" },
  { href: "/hr", icon: "groups", label: "HR" },
  { href: "/accounts", icon: "account_balance", label: "Accounts" },
  { href: "/reports", icon: "assessment", label: "Reports" },
];

const bottomItems = [
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-[14px] left-4 z-50 p-2 hover:bg-[#f2f4f6] rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[#0F172A]">menu</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#131B2E] flex flex-col py-6 px-3 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 px-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">YardFlow</h1>
            <p className="text-[#7c839b] text-xs uppercase tracking-widest mt-1">
              Industrial ERP
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-[#3f465c] rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-[#7c839b]">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                  active
                    ? "bg-[#3f465c] text-white"
                    : "text-[#7c839b] hover:bg-[#3f465c] hover:text-white"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-[#3f465c]/30">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                  active
                    ? "bg-[#3f465c] text-white"
                    : "text-[#7c839b] hover:bg-[#3f465c] hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
