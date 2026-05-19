import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

export interface SessionPayload {
  user_id: string;
  org_id: string;
  role: "owner" | "manager" | "worker";
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireOrg(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.org_id;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
