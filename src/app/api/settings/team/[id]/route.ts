import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const orgId = await requireOrg();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, params.id),
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
      .where(eq(users.id, params.id))
      .returning();

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
  { params }: { params: { id: string } },
) {
  const orgId = await requireOrg();

  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(
      and(
        eq(users.id, params.id),
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
    .where(eq(users.id, params.id));

  return NextResponse.json({ success: true });
}
