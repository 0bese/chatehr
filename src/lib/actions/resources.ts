"use server";
import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { client, db } from "@/lib/db";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
import { nanoid } from "@/lib/utils";

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);
    const resourceId = nanoid();

    // Insert into resources table
    await (db as any).insert(resources).values({
      id: resourceId,
      content,
    });

    const embeddings = await generateEmbeddings(content);

    // // Insert into embeddings table
    for (const embedding of embeddings) {
      const embeddingId = nanoid();
      const vectorString = `[${embedding.embedding.join(",")}]`;

      await client.execute(
        "INSERT INTO embeddings (id, resource_id, content, embedding) VALUES (?, ?, ?, ?)",
        [embeddingId, resourceId, embedding.content || content, vectorString]
      );
    }

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
