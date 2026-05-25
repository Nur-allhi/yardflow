import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  const orgId = session.org_id;

  const [org] = await db
    .select({ inventory_mode: organizations.inventory_mode })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({ mode: org.inventory_mode });
}
