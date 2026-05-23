import { useQuery } from "@tanstack/react-query";

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: "shipyard" | "consumable" | "other";
  opening_balance: number;
  is_active: boolean;
  total_purchases: number;
  total_paid: number;
  total_amount: number;
  due_balance: number;
}

async function fetchVendors(): Promise<Vendor[]> {
  const res = await fetch("/api/purchases/vendors");
  if (!res.ok) throw new Error("Failed to load vendors");
  return res.json();
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });
}

export type { Vendor };
