import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { vendors, customers, workers } from "@/lib/db/schema";
import { sql, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ vendors: [], customers: [], workers: [] });
  }

  const query = `%${q.trim()}%`;

  const vendorResults = await db
    .select({ id: vendors.id, name: vendors.name, phone: vendors.phone })
    .from(vendors)
    .where(
      and(
        sql`${vendors.organization_id} = ${session.org_id}`,
        sql`${vendors.deleted_at} IS NULL`,
        sql`(${vendors.name} ILIKE ${query} OR ${vendors.phone} ILIKE ${query})`,
      ),
    )
    .limit(5);

  const customerResults = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .where(
      and(
        sql`${customers.organization_id} = ${session.org_id}`,
        sql`${customers.deleted_at} IS NULL`,
        sql`(${customers.name} ILIKE ${query} OR ${customers.phone} ILIKE ${query})`,
      ),
    )
    .limit(5);

  const workerResults = await db
    .select({ id: workers.id, name: workers.name, phone: workers.phone })
    .from(workers)
    .where(
      and(
        sql`${workers.organization_id} = ${session.org_id}`,
        sql`${workers.deleted_at} IS NULL`,
        sql`(${workers.name} ILIKE ${query} OR ${workers.phone} ILIKE ${query})`,
      ),
    )
    .limit(5);

  return NextResponse.json({
    vendors: vendorResults,
    customers: customerResults,
    workers: workerResults,
  });
}
