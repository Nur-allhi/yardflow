import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "manager"]),
});

export async function GET() {
  const orgId = await requireOrg();

  const team = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      is_active: users.is_active,
      created_at: users.created_at,
    })
    .from(users)
    .where(
      and(
        eq(users.organization_id, orgId),
        sql`${users.deleted_at} IS NULL`,
      ),
    )
    .orderBy(users.created_at);

  return NextResponse.json(team);
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        organization_id: orgId,
        name,
        email,
        password_hash,
        role,
      })
      .returning();

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 },
    );
  }
}
