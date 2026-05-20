import { getSession } from "./session";
import { NextResponse } from "next/server";

export async function requireRole(...roles: string[]) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roles.includes(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions" },
      { status: 403 },
    );
  }
  return null;
}
