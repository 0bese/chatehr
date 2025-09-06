import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey =
  process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

export interface SessionUser {
  id: string; // DB user ID
  practitionerId: string;
  practitionerName?: string;
  patientId?: string;
  patientName?: string;
  fhirBaseUrl: string;
  accessToken: string;
}

export interface SessionPayload extends SessionUser {
  expires: string;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7 days")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as any;
}

export async function createSession(user: SessionUser) {
  console.log("user: ", user);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hr
  const session = await encrypt({ ...user, expires: expires.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: "lax",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    return await decrypt(session);
  } catch (error) {
    console.error("Failed to decrypt session:", error);
    return null;
  }
}

export async function updateSession() {
  const session = await getSession();
  if (!session) return;

  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const updatedSession = await encrypt({
    ...session,
    expires: expires.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set("session", updatedSession, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// For server components - use this in your server actions and page components
export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getCurrentUserServer();
}

export async function getCurrentUserServer(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.id,
    practitionerId: session.practitionerId,
    practitionerName: session.practitionerName,
    patientId: session.patientId,
    patientName: session.patientName,
    fhirBaseUrl: session.fhirBaseUrl,
    accessToken: session.accessToken,
  };
}
