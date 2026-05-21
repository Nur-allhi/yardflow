import { useQuery } from "@tanstack/react-query";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: "regular" | "walk_in";
  opening_balance: number;
  is_active: boolean;
  total_purchases: number;
  total_paid: number;
}

async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch("/api/sales/customers");
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });
}

export type { Customer };
