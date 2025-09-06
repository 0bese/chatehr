"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/chat";
import { eq } from "drizzle-orm";
import { createSession, SessionUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface FhirUserData {
  practitionerId: string;
  name: string;
  fhirBaseUrl: string;
  accessToken: string;
  patientId?: string;
  encounterId?: string;
  patientName?: string;
}

export async function createOrUpdateUser(
  fhirData: FhirUserData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.practitionerId, fhirData.practitionerId))
      .limit(1);

    let userId: string;
    let userName: string | undefined;

    if (existingUser.length > 0) {
      // User exists, update if necessary
      userId = existingUser[0].id;
      userName = existingUser[0].name || fhirData.name;

      // Update user info if needed
      if (fhirData.name && existingUser[0].name !== fhirData.name) {
        await db
          .update(users)
          .set({
            name: fhirData.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
        userName = fhirData.name;
      }
    } else {
      // Create new user
      userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        practitionerId: fhirData.practitionerId,
        name: fhirData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userName = fhirData.name;
    }

    // Create session
    const sessionUser: SessionUser = {
      id: userId,
      practitionerId: fhirData.practitionerId,
      practitionerName: userName,
      patientId: fhirData.patientId,
      patientName: fhirData.patientName,
      fhirBaseUrl: fhirData.fhirBaseUrl,
      accessToken: fhirData.accessToken,
    };

    await createSession(sessionUser);

    return { success: true };
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function signOut(): Promise<void> {
  const { deleteSession } = await import("@/lib/auth");
  await deleteSession();
}
