"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "cmdk";

const navItems = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Inventory", href: "/inventory", icon: "inventory_2" },
  { label: "Purchases", href: "/purchases", icon: "shopping_cart" },
  { label: "Sales", href: "/sales", icon: "sell" },
  { label: "HR", href: "/hr", icon: "groups" },
  { label: "Accounts", href: "/accounts", icon: "account_balance" },
  { label: "Reports", href: "/reports", icon: "assessment" },
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "Team", href: "/settings/team", icon: "group" },
  { label: "Vendors", href: "/purchases/vendors", icon: "local_shipping" },
  { label: "Customers", href: "/sales/customers", icon: "people" },
];

const quickActions = [
  { label: "New Purchase", href: "/purchases/new", icon: "add_shopping_cart" },
  { label: "New Sale", href: "/sales/new", icon: "add_circle" },
  { label: "New Worker", href: "/hr/workers/new", icon: "person_add" },
  { label: "New Account", href: "/accounts/new", icon: "account_balance_wallet" },
  { label: "Generate Report", href: "/reports/generate", icon: "summarize" },
  { label: "New Category", href: "/inventory/categories", icon: "category" },
  { label: "Deposit", href: "/accounts/deposit", icon: "payments" },
  { label: "Transfer", href: "/accounts/transfer", icon: "swap_horiz" },
];

const STORAGE_KEY = "command_palette_recent";

function getRecent(): { label: string; href: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushRecent(label: string, href: string) {
  const recent = getRecent().filter((r) => r.href !== href);
  recent.unshift({ label, href });
  if (recent.length > 5) recent.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

interface Entity {
  id: string;
  name: string;
  phone: string | null;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState<Entity[]>([]);
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [workers, setWorkers] = useState<Entity[]>([]);
  const [recent, setRecent] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setSearch("");
      setVendors([]);
      setCustomers([]);
      setWorkers([]);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const debouncedSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setVendors([]);
      setCustomers([]);
      setWorkers([]);
      return;
    }
    try {
      const res = await fetch(`/api/command-palette?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors ?? []);
        setCustomers(data.customers ?? []);
        setWorkers(data.workers ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const navigate = useCallback(
    (label: string, href: string) => {
      pushRecent(label, href);
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[100]"
        onClick={() => setOpen(false)}
      />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-outline-variant z-[101] animate-in fade-in zoom-in-95 duration-150">
        <Command
          shouldFilter={false}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <CommandInput
            placeholder="Search pages, actions, or entities..."
            value={search}
            onValueChange={setSearch}
            className="w-full px-4 py-3 text-sm bg-transparent border-b border-outline-variant outline-none placeholder:text-secondary"
          />
          <CommandList className="max-h-72 overflow-y-auto p-2">
            <CommandEmpty className="px-2 py-6 text-sm text-secondary text-center">
              No results found
            </CommandEmpty>

            {search.trim().length === 0 && recent.length > 0 && (
              <CommandGroup heading="Recent">
                {recent.map((r) => (
                  <CommandItem
                    key={r.href}
                    value={r.href}
                    onSelect={() => navigate(r.label, r.href)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                  >
                    <span className="material-symbols-outlined text-lg text-secondary">
                      history
                    </span>
                    {r.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Navigation">
              {navItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => navigate(item.label, item.href)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                >
                  <span className="material-symbols-outlined text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.href}
                  value={action.label}
                  onSelect={() => navigate(action.label, action.href)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                >
                  <span className="material-symbols-outlined text-lg">
                    {action.icon}
                  </span>
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {search.trim().length > 0 && (
              <>
                {vendors.length > 0 && (
                  <CommandGroup heading="Vendors">
                    {vendors.map((v) => (
                      <CommandItem
                        key={`vendor-${v.id}`}
                        value={`vendor-${v.name}`}
                        onSelect={() =>
                          navigate(
                            v.name,
                            `/purchases/vendors/${v.id}`,
                          )
                        }
                        className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                      >
                        <span className="material-symbols-outlined text-lg text-secondary">
                          local_shipping
                        </span>
                        <span>{v.name}</span>
                        {v.phone && (
                          <span className="text-secondary text-xs ml-auto">
                            {v.phone}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {customers.length > 0 && (
                  <CommandGroup heading="Customers">
                    {customers.map((c) => (
                      <CommandItem
                        key={`customer-${c.id}`}
                        value={`customer-${c.name}`}
                        onSelect={() =>
                          navigate(c.name, `/sales/customers/${c.id}`)
                        }
                        className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                      >
                        <span className="material-symbols-outlined text-lg text-secondary">
                          people
                        </span>
                        <span>{c.name}</span>
                        {c.phone && (
                          <span className="text-secondary text-xs ml-auto">
                            {c.phone}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {workers.length > 0 && (
                  <CommandGroup heading="Workers">
                    {workers.map((w) => (
                      <CommandItem
                        key={`worker-${w.id}`}
                        value={`worker-${w.name}`}
                        onSelect={() =>
                          navigate(w.name, `/hr/workers/${w.id}`)
                        }
                        className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer aria-selected:bg-surface-container-high aria-selected:text-primary-container"
                      >
                        <span className="material-symbols-outlined text-lg text-secondary">
                          person
                        </span>
                        <span>{w.name}</span>
                        {w.phone && (
                          <span className="text-secondary text-xs ml-auto">
                            {w.phone}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </div>
    </>
  );
}
