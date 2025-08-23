// your search file
import { embedMany, embed } from "ai";
import { google } from "@ai-sdk/google";
import { client } from "@/lib/db";

const embeddingModel = google.textEmbedding("gemini-embedding-001");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings: embeddedChunks } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddedChunks.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  try {
    // Generate embedding for the user query
    const userQueryEmbedded = await generateEmbedding(userQuery);
    const vectorString = `[${userQueryEmbedded.join(",")}]`;

    // Use TiDB's VEC_COSINE_DISTANCE function for similarity search
    // Lower cosine distance = higher similarity
    const result = await client.execute(
      `
      SELECT 
        e.content,
        e.resource_id,
        r.content as resource_content,
        VEC_COSINE_DISTANCE(e.embedding, ?) as distance,
        (1 - VEC_COSINE_DISTANCE(e.embedding, ?)) as similarity
      FROM embeddings e
      JOIN resources r ON e.resource_id = r.id
      WHERE (1 - VEC_COSINE_DISTANCE(e.embedding, ?)) > 0.5
      ORDER BY VEC_COSINE_DISTANCE(e.embedding, ?) ASC
      LIMIT 4
    `,
      [vectorString, vectorString, vectorString, vectorString]
    );

    // Handle different return types - check if result has rows property or is array directly
    const rows = Array.isArray(result) ? result : (result as any).rows || [];

    // Transform the results to match your expected format
    return rows.map((row: any) => ({
      name: row.content,
      similarity: row.similarity,
      resource_id: row.resource_id,
      resource_content: row.resource_content,
      distance: row.distance,
    }));
  } catch (error) {
    console.error("Error in findRelevantContent:", error);
    throw error;
  }
};
