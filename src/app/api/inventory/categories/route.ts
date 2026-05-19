import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(_request: Request) {
  const orgId = await requireOrg();

  const categories = await db
    .select()
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.organization_id, orgId),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .orderBy(materialCategories.name);

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

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
        organization_id: orgId,
        name: parsed.data.name,
        description: parsed.data.description || null,
      })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
