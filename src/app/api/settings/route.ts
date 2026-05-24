import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const updateOrgSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  inventory_mode: z.enum(["detailed", "simple"]).optional(),
});

export async function GET() {
  const session = await requireSession();
  const orgId = session.org_id;

  const [org] = await db
    .select()
    .from(organizations)
    .where(
      and(eq(organizations.id, orgId), sql`${organizations.deleted_at} IS NULL`),
    )
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: org.id,
    name: org.name,
    address: org.address,
    phone: org.phone,
    email: org.email,
    plan: org.plan,
    inventory_mode: org.inventory_mode,
  });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;
  const userId = session.user_id;

  try {
    const body = await request.json();
    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, address, phone, email, inventory_mode } = parsed.data;

    const [org] = await db
      .update(organizations)
      .set({
        name,
        address: address ?? null,
        phone: phone ?? null,
        email: email ?? null,
        inventory_mode: inventory_mode ?? undefined,
        updated_at: sql`NOW()`,
      })
      .where(
        and(eq(organizations.id, orgId), sql`${organizations.deleted_at} IS NULL`),
      )
      .returning();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    logActivity({
      orgId,
      userId,
      action: "update",
      entityType: "organization",
      entityId: orgId,
      description: "Updated organization settings",
      changes: { name, address, phone, email },
    });

    return NextResponse.json({
      id: org.id,
      name: org.name,
      address: org.address,
      phone: org.phone,
      email: org.email,
      plan: org.plan,
      inventory_mode: org.inventory_mode,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
