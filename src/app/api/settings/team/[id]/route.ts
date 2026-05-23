import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;
  const userId = session.user_id;

  const [existing] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        eq(users.organization_id, orgId),
        sql`${users.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await _request.json();
    const is_active = body.is_active;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active boolean field required" },
        { status: 400 },
      );
    }

    const [user] = await db
      .update(users)
      .set({ is_active, updated_at: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();

    logActivity({
      orgId,
      userId,
      action: "update",
      entityType: "user",
      entityId: user.id,
      description: `${is_active ? "Activated" : "Deactivated"} ${user.name}`,
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const orgId = session.org_id;
  const userId = session.user_id;

  const [existing] = await db
    .select({ id: users.id, role: users.role, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        eq(users.organization_id, orgId),
        sql`${users.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (existing.role === "owner") {
    return NextResponse.json(
      { error: "Cannot delete the owner account" },
      { status: 403 },
    );
  }

  await db
    .update(users)
    .set({ deleted_at: sql`NOW()`, updated_at: sql`NOW()` })
    .where(eq(users.id, id));

  logActivity({
    orgId,
    userId,
    action: "delete",
    entityType: "user",
    entityId: id,
    description: `Removed ${existing.name} from team`,
  });

  return NextResponse.json({ success: true });
}
