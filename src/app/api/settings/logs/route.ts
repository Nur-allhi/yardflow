import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { eq, and, sql, desc, like, gte, lte } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const entityType = searchParams.get("entity_type");
  const action = searchParams.get("action");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const search = searchParams.get("search");

  const conditions = [
    eq(activityLogs.organization_id, orgId),
    sql`${activityLogs.deleted_at} IS NULL`,
  ] as (ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof sql> | ReturnType<typeof and> | ReturnType<typeof gte> | ReturnType<typeof lte>)[];

  if (entityType) conditions.push(eq(activityLogs.entity_type, entityType));
  if (action) conditions.push(eq(activityLogs.action, action));
  if (startDate) conditions.push(gte(activityLogs.created_at, new Date(startDate)));
  if (endDate) conditions.push(lte(activityLogs.created_at, new Date(endDate)));
  if (search) conditions.push(like(activityLogs.description, `%${search}%`));

  const offset = (page - 1) * limit;

  const [logs, countResult] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entity_type: activityLogs.entity_type,
        entity_id: activityLogs.entity_id,
        description: activityLogs.description,
        changes: activityLogs.changes,
        created_at: activityLogs.created_at,
        user_name: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.user_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogs.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activityLogs)
      .where(and(...conditions))
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      changes: l.changes ? JSON.parse(JSON.stringify(l.changes)) : null,
    })),
    total: countResult,
    page,
    totalPages: Math.ceil(countResult / limit),
  });
}
