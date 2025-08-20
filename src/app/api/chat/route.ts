import { toUIMessageStream } from "@ai-sdk/langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createUIMessageStreamResponse, UIMessage } from "ai";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

//allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages: UIMessage[];
  } = await req.json();

  console.log("message from frontend", messages);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxRetries: 2,
    apiKey: "AIzaSyBVuIeew9r-Om7csU7J9TzHt7NaawrEH3E",
  });

  const stream = await model.stream(
    messages.map((message) =>
      message.role == "user"
        ? new HumanMessage({
            content: message.parts.map(
              (part) =>
                part.type === "text"
                  ? { type: "text", text: part.text }
                  : { type: "image_url", image_url: part } // 👈 handle images
            ),
          })
        : new AIMessage(
            message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("")
          )
    )
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
}
