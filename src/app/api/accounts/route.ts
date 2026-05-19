import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organization_id, orgId),
        eq(accounts.is_active, true),
        sql`${accounts.deleted_at} IS NULL`,
      ),
    )
    .orderBy(accounts.name);

  return NextResponse.json(
    result.map((a) => ({ ...a, current_balance: Number(a.current_balance) })),
  );
}
