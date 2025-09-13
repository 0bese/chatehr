import { NextRequest, NextResponse } from "next/server";
import { createResource } from "@/lib/actions/resources";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings } from "@/lib/db/schema/embeddings";
import { eq, sql } from "drizzle-orm";

// GET: Fetch all collections
export async function GET() {
  try {
    const allResources = await db
      .select()
      .from(resources)
      .orderBy(sql`${resources.createdAt} DESC`);

    return NextResponse.json(allResources);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST: Create new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, filename } = body;

    console.log("this is the content: ", content);
    console.log("this is the content: ", filename);

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Use the existing createResource function which handles embeddings
    const result = await createResource({ content });

    if (typeof result === "string" && result.includes("successfully")) {
      return NextResponse.json({
        message: "Collection created successfully",
        filename,
      });
    } else {
      return NextResponse.json({ error: result }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
