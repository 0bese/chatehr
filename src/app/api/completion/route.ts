import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { toUIMessageStream } from "@ai-sdk/langchain";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const model = new ChatGoogleGenerativeAI({
    model: "gpt-3.5-turbo-0125",
    temperature: 0,
  });

  const stream = await model.stream(prompt);

  return toUIMessageStream(stream);
}
