import { useQuery } from "@tanstack/react-query";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  designation: string | null;
  monthly_salary: number;
  join_date: string | null;
  is_active: boolean;
  this_month_advances: number;
}

interface WorkersSummary {
  total_workers: number;
  monthly_payroll: number;
  pending_advances: number;
}

interface WorkersResponse {
  workers: Worker[];
  summary: WorkersSummary;
}

async function fetchWorkers(): Promise<WorkersResponse> {
  const res = await fetch("/api/hr/workers");
  if (!res.ok) throw new Error("Failed to load workers");
  return res.json();
}

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: fetchWorkers,
  });
}

export type { Worker, WorkersSummary, WorkersResponse };
