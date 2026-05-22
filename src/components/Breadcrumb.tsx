"use client";

import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href: string | null;
};

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-secondary mb-2 font-medium tracking-wide uppercase">
      {items.map((item, i) => {
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary-container">
                {item.label}
              </Link>
            ) : (
              <span className="text-primary-container font-bold">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
