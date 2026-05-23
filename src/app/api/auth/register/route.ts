import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/schemas";
import { createSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { company_name, address, phone, owner_name, email, password } =
      parsed.data;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const password_hash = await bcrypt.hash(password, 12);
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: company_name,
          address,
          phone,
          created_at: now,
          updated_at: now,
        })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          organization_id: org.id,
          name: owner_name,
          email,
          password_hash,
          role: "owner",
          created_at: now,
          updated_at: now,
        })
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

      return { org, user };
    });

    await createSession({
      user_id: result.user.id,
      org_id: result.org.id,
      role: result.user.role,
    });

    logActivity({
      orgId: result.org.id,
      userId: result.user.id,
      action: "create",
      entityType: "organization",
      entityId: result.org.id,
      description: "Registered organization",
    });

    return NextResponse.json(
      {
        user: result.user,
        organization: { id: result.org.id, name: result.org.name },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
