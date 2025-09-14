import { NextRequest, NextResponse } from "next/server";
import { createResource } from "@/lib/actions/resources";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings } from "@/lib/db/schema/embeddings";
import { eq, sql } from "drizzle-orm";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

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

// Helper function to convert ArrayBuffer to Buffer
function arrayBufferToBuffer(arrayBuffer: ArrayBuffer): Buffer {
  return Buffer.from(arrayBuffer);
}

// Helper function to process file with LangChain loaders
async function processFileWithLangChain(
  file: File,
  fileName: string
): Promise<string> {
  try {
    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = arrayBufferToBuffer(arrayBuffer);

    // Create a Blob for LangChain
    const blob = new Blob([buffer], { type: file.type });
    const fileExtension = fileName.toLowerCase().split(".").pop();

    let loader;
    switch (fileExtension) {
      case "pdf":
        loader = new PDFLoader(blob);
        break;
      case "json":
        loader = new JSONLoader(blob);
        break;
      case "csv":
        loader = new CSVLoader(blob);
        break;
      case "txt":
      case "md":
      default:
        loader = new TextLoader(blob);
        break;
    }

    // Load documents
    const docs = await loader.load();

    if (!docs || docs.length === 0) {
      throw new Error("No content could be extracted from the file");
    }

    // Combine all document content
    const fullContent = docs.map((doc) => doc.pageContent).join("\n\n");

    if (!fullContent.trim()) {
      throw new Error("Extracted content is empty");
    }

    console.log(
      `Successfully extracted ${fullContent.length} characters from ${fileName}`
    );
    console.log("full content:", fullContent);
    return fullContent;
  } catch (error) {
    console.error("Error processing file with LangChain:", error);
    throw new Error(
      `Failed to process file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// POST: Create new collection with file upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    console.log("file name", filename);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Process the file with LangChain
    const content = await processFileWithLangChain(file, filename);

    console.log(
      `Processing file: ${filename}, content length: ${content.length} characters`
    );

    // Use the existing createResource function which handles embeddings
    const result = await createResource({ content });

    if (typeof result === "string" && result.includes("successfully")) {
      return NextResponse.json({
        message: "Collection created successfully",
        filename,
        contentLength: content.length,
      });
    } else {
      return NextResponse.json({ error: result }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create collection",
      },
      { status: 500 }
    );
  }
}
