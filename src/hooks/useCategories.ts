import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Subtype {
  id: string;
  category_id: string;
  name: string;
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/inventory/categories");
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

async function fetchSubtypes(categoryId?: string): Promise<Subtype[]> {
  const url = categoryId
    ? `/api/inventory/subtypes?category_id=${categoryId}`
    : "/api/inventory/subtypes";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load subtypes");
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}

export function useSubtypes(categoryId?: string) {
  return useQuery({
    queryKey: ["subtypes", categoryId ?? "all"],
    queryFn: () => fetchSubtypes(categoryId),
  });
}
