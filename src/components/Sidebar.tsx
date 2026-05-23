"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { staggerContainer, navItemVariants, activeIndicatorVariants, springSnap } from "@/lib/animation";
import { APP_VERSION, COMMIT_HASH } from "@/lib/version";

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

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-primary-container flex-col py-6 px-3 z-50">
      <div className="mb-8 px-4">
        <h1 className="font-display text-2xl font-bold text-white">YardFlow</h1>
        <p className="text-on-primary-container text-xs uppercase tracking-widest mt-1">
          Industrial ERP
        </p>
      </div>

      <motion.nav
        className="flex-1 space-y-1"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <motion.div key={item.href} variants={navItemVariants} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }} className="relative">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container ${
                  active
                    ? "bg-on-primary-fixed-variant text-white"
                    : "text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white"
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
              {active && (
                <motion.div
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-white"
                  layoutId="sidebar-active"
                  variants={activeIndicatorVariants}
                  initial="inactive"
                  animate="active"
                  transition={springSnap}
                />
              )}
            </motion.div>
          );
        })}
      </motion.nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-on-primary-fixed-variant/30">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container ${
                active
                  ? "bg-on-primary-fixed-variant text-white"
                  : "text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
        <div className="px-4 py-2 mb-1 space-y-2">
          {role && (
            <div className="flex items-center gap-2 text-on-primary-container/70 text-xs">
              <span className="material-symbols-outlined text-[14px]">badge</span>
              <span className="capitalize font-medium">{role}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-on-primary-container/50 text-[11px]">
            <span className="material-symbols-outlined text-[13px]">info</span>
            <span className="font-mono">v{APP_VERSION} ({COMMIT_HASH})</span>
          </div>
        </div>
        <button
          onClick={() => {
            fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              window.location.href = "/login";
            });
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-md transition-all text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white w-full text-left focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
