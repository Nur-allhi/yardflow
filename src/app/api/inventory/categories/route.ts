import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(_request: Request) {
  const session = await requireSession();

  const categories = await db
    .select()
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.organization_id, session.org_id),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .orderBy(materialCategories.name);

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await requireSession();

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [category] = await db
      .insert(materialCategories)
      .values({
        organization_id: session.org_id,
        name: parsed.data.name,
        description: parsed.data.description || null,
      })
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "category",
      entityId: category.id,
      description: `Created category ${category.name}`,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
