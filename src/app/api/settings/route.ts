import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
});

export async function GET() {
  const orgId = await requireOrg();

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
  });
}

export async function PUT(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, address, phone, email } = parsed.data;

    const [org] = await db
      .update(organizations)
      .set({
        name,
        address: address ?? null,
        phone: phone ?? null,
        email: email ?? null,
        updated_at: sql`NOW()`,
      })
      .where(
        and(eq(organizations.id, orgId), sql`${organizations.deleted_at} IS NULL`),
      )
      .returning();

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
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
