"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fadeIn, staggerContainer, navItemVariants } from "@/lib/animation";

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
        className="md:hidden fixed top-[14px] left-4 z-50 p-2 hover:bg-surface-container-low rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-primary-container">menu</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setOpen(false)}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />

            {/* Drawer */}
            <motion.aside
              className="fixed top-0 left-0 h-full w-[280px] bg-primary-container flex flex-col py-6 px-3 z-50 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 250, damping: 32 }}
            >
              <div className="mb-8 px-4 flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">YardFlow</h1>
                  <p className="text-on-primary-container text-xs uppercase tracking-widest mt-1">
                    Industrial ERP
                  </p>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-on-primary-fixed-variant rounded-lg transition-colors"
                  aria-label="Close menu"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="material-symbols-outlined text-on-primary-container">close</span>
                </motion.button>
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
                    <motion.div key={item.href} variants={navItemVariants} whileTap={{ scale: 0.97 }}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
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
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
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
              <button
                onClick={() => {
                  setOpen(false);
                  fetch("/api/auth/logout", { method: "POST" }).finally(() => {
                    window.location.href = "/login";
                  });
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-md transition-all text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white w-full text-left"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}