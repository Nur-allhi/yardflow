import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialSubtypes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

const updateSubtypeSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["kg", "ton"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();

  const [subtype] = await db
    .select()
    .from(materialSubtypes)
    .where(
      and(
        eq(materialSubtypes.id, id),
        eq(materialSubtypes.organization_id, session.org_id),
        sql`${materialSubtypes.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!subtype) {
    return NextResponse.json({ error: "Subtype not found" }, { status: 404 });
  }

  return NextResponse.json(subtype);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();

  try {
    const body = await request.json();
    const parsed = updateSubtypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: materialSubtypes.id })
      .from(materialSubtypes)
      .where(
        and(
          eq(materialSubtypes.id, id),
          eq(materialSubtypes.organization_id, session.org_id),
          sql`${materialSubtypes.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Subtype not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(materialSubtypes)
      .set({
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        unit: parsed.data.unit ?? undefined,
        updated_at: sql`NOW()`,
      })
      .where(
        and(
          eq(materialSubtypes.id, id),
          eq(materialSubtypes.organization_id, session.org_id),
        ),
      )
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "update",
      entityType: "subtype",
      entityId: updated.id,
      description: `Updated subtype ${updated.name}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating subtype:", error);
    return NextResponse.json(
      { error: "Failed to update subtype" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();

  const [existing] = await db
    .select({ id: materialSubtypes.id })
    .from(materialSubtypes)
    .where(
      and(
        eq(materialSubtypes.id, id),
        eq(materialSubtypes.organization_id, session.org_id),
        sql`${materialSubtypes.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Subtype not found" }, { status: 404 });
  }

  await db
    .update(materialSubtypes)
    .set({ deleted_at: sql`NOW()` })
    .where(
      and(
        eq(materialSubtypes.id, id),
        eq(materialSubtypes.organization_id, session.org_id),
      ),
    );

  return NextResponse.json({ success: true });
}
