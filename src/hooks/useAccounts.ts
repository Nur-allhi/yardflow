import { useQuery } from "@tanstack/react-query";

interface Account {
  id: string;
  name: string;
  type: "cash" | "bank";
  bank_name: string | null;
  account_number: string | null;
  current_balance: number;
}

async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch("/api/accounts");
  if (!res.ok) throw new Error("Failed to load accounts");
  return res.json();
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
}
