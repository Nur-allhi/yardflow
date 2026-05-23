import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";

interface LogActivityParams {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  changes?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  await db.insert(activityLogs).values({
    organization_id: params.orgId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    description: params.description,
    changes: params.changes || null,
  });
}
