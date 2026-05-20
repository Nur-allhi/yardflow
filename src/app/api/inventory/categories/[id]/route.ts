import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [category] = await db
    .select()
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.id, id),
        eq(materialCategories.organization_id, orgId),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: materialCategories.id })
      .from(materialCategories)
      .where(
        and(
          eq(materialCategories.id, id),
          eq(materialCategories.organization_id, orgId),
          sql`${materialCategories.deleted_at} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(materialCategories)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        updated_at: sql`NOW()`,
      })
      .where(
        and(
          eq(materialCategories.id, id),
          eq(materialCategories.organization_id, orgId),
        ),
      )
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [existing] = await db
    .select({ id: materialCategories.id })
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.id, id),
        eq(materialCategories.organization_id, orgId),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await db
    .update(materialCategories)
    .set({ deleted_at: sql`NOW()` })
    .where(
      and(
        eq(materialCategories.id, id),
        eq(materialCategories.organization_id, orgId),
      ),
    );

  return NextResponse.json({ success: true });
}
