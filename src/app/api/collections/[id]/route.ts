import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings } from "@/lib/db/schema/embeddings";
import { eq } from "drizzle-orm";

// DELETE: Delete a collection and its embeddings
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // First delete all embeddings for this resource
    await db.delete(embeddings).where(eq(embeddings.resourceId, id));

    // Then delete the resource itself
    const result = await db.delete(resources).where(eq(resources.id, id));

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}