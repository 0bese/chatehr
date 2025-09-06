import {
  convertToModelMessages,
  createIdGenerator,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  TypeValidationError,
} from "ai";
import { google } from "@ai-sdk/google";
import { loadChat, saveChat, verifyChatAccess } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";

import { NextRequest } from "next/server";
import z from "zod";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { convertMCPToolToAiTool } from "@/lib/utils";
import { findRelevantContent } from "@/lib/ai/embedding";
export const maxDuration = 30;

const client = new MultiServerMCPClient({
  throwOnLoadError: true,
  prefixToolNameWithServerName: false,
  additionalToolNamePrefix: "",
  useStandardContentBlocks: true,

  mcpServers: {
    "fhir-mcp": {
      url: "https://fhir-mcp.onrender.com/mcp",
      automaticSSEFallback: false,
    },
  },
});

const toools = await client.getTools();
console.log(toools);
const aiTools = Object.assign({}, ...toools.map(convertMCPToolToAiTool));
getInformation: tool({
  description: `get information from your knowledge base to answer personal  questions.`,
  inputSchema: z.object({
    question: z.string().describe("the users question"),
  }),
  execute: async ({ question }) => findRelevantContent(question),
});

const tools = {
  ...aiTools,
  getCurrentDate: tool({
    description: "Get the current date and time with timezone information",
    inputSchema: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        timestamp: now.getTime(),
        iso: now.toISOString(),
        local: now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utc: now.toUTCString(),
      };
    },
  }),
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.practitionerId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    //   await req.json();
    const a = await req.json();
    const message = a.message;
    const chatId = a.id;

    if (!chatId || !message) {
      return new Response("Missing chatId or messages", { status: 400 });
    }

    // First, verify the chat exists and belongs to this practitioner
    const chatExists = await verifyChatAccess({
      id: chatId,
      practitionerId: user.practitionerId,
    });

    if (!chatExists) {
      return new Response("Chat not found or access denied", { status: 404 });
    }

    // Load previous messages
    const previousMessages = await loadChat({
      id: chatId,
      practitionerId: user.practitionerId,
    });

    // Append new message
    const messages = [...previousMessages, message].filter(Boolean);
    console.log("all messages dawgggg ", messages);

    // const validatedMessages = await validateUIMessages({
    //   messages,
    //   tools,
    // })

    // Validate messages
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
      experimental_transform: smoothStream({
        delayInMs: 20, // optional: defaults to 10ms
        chunking: "word", // optional: defaults to 'word'
      }),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onFinish: async ({ messages: updatedMessages }) => {
        await saveChat({
          chatId,
          practitionerId: user.practitionerId,
          messages: updatedMessages,
        });
      },
      //  await mcpClient.close();
    });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.error("Message validation failed:", error);
      return new Response("Invalid message format", { status: 400 });
    }
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// GET endpoint for resuming streams (optional)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.practitionerId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("chatId is required", { status: 400 });
  }

  // Check if chat exists and belongs to user
  const chatMessages = await loadChat({
    id: chatId,
    practitionerId: user.practitionerId,
  });

  if (!chatMessages) {
    return new Response("Chat not found", { status: 404 });
  }

  // Return empty stream - actual resumable stream handling would go here
  return new Response(null, { status: 204 });
}

// import { toUIMessageStream } from "@ai-sdk/langchain";
// import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
// import {
//   createUIMessageStreamResponse,
//   UIMessage as VercelChatMessage,
//   generateId,
// } from "ai";
// import { tool } from "@langchain/core/tools";
// import { createReactAgent } from "@langchain/langgraph/prebuilt";
// import { z } from "zod";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatOpenAI } from "@langchain/openai";
// import { saveChat, loadChat, createChat } from "@/lib/actions/chat";

// //allow streaming responses up to 30 seconds
// export const maxDuration = 30;
// export const runtime = "edge";

// const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
//   if (message.getType() === "human") {
//     return {
//       content: message.content,
//       role: "user" as const,
//       parts: [{ type: "text", text: message.content }],
//     };
//   } else if (message.getType() === "ai") {
//     const aiMessage = message as AIMessage;

//     // Check if this is a tool call message
//     if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
//       return {
//         content: aiMessage.content,
//         role: "assistant" as const,
//         tool_calls: aiMessage.tool_calls.map((tc) => ({
//           id: tc.id,
//           type: "function" as const,
//           function: {
//             name: tc.name,
//             arguments: JSON.stringify(tc.args),
//           },
//         })),
//         parts: [{ type: "text", text: aiMessage.content }],
//       };
//     }

//     return {
//       content: aiMessage.content,
//       role: "assistant" as const,
//       tool_calls: [],
//       parts: [{ type: "text", text: aiMessage.content }],
//     };
//   } else if (message.getType() === "tool") {
//     const toolMessage = message as any; // ToolMessage type might be different
//     return {
//       content: toolMessage.content,
//       role: "tool" as const,
//       tool_call_id: toolMessage.tool_call_id,
//       name: toolMessage.name,
//       parts: [{ type: "text", text: toolMessage.content }],
//     };
//   } else {
//     return {
//       content: message.content,
//       role: message.getType() as "user" | "assistant" | "system" | "tool",
//       parts: [{ type: "text", text: message.content }],
//     };
//   }
// };

// const convertVercelMessageToLangChainMessage = (
//   message: VercelChatMessage
// ): BaseMessage => {
//   if (message.role === "user") {
//     return new HumanMessage({
//       content: message.parts.map((part) =>
//         part.type === "text"
//           ? { type: "text", text: part.text }
//           : { type: "image_url", image_url: part }
//       ),
//     });
//   } else if (message.role === "assistant") {
//     return new AIMessage(
//       message.parts
//         .map((part) => (part.type === "text" ? part.text : ""))
//         .join("")
//     );
//   } else {
//     // Handle other message types by converting them to HumanMessage
//     return new HumanMessage({
//       content:
//         typeof message.parts === "string"
//           ? message.parts
//           : JSON.stringify(message.parts),
//     });
//   }
// };

// export async function POST(req: Request) {
//   const {
//     messages: vercelMessages,
//     chatId: existingChatId,
//     userId, // You need to provide a user ID
//   }: {
//     messages: VercelChatMessage[];
//     chatId?: string;
//     userId: string;
//   } = await req.json();

//   const chatId = existingChatId || (await createChat(userId));

//   const model = new ChatGoogleGenerativeAI({
//     model: "gemini-2.5-flash",
//     temperature: 0.3,
//     maxRetries: 2,
//     apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
//   });

//   const getCurrentDate = tool(
//     async (): Promise<object> => {
//       const now = new Date();
//       return {
//         timestamp: now.getTime(),
//         iso: now.toISOString(),
//         local: now.toLocaleString("en-US", {
//           weekday: "long",
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           second: "2-digit",
//           timeZoneName: "short",
//         }),
//         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         utc: now.toUTCString(),
//       };
//     },
//     {
//       name: "getCurrentDate",
//       description: "Get the current date and time with timezone information",
//       schema: z.object({}), // no input
//     }
//   );

//   const agent = createReactAgent({
//     llm: model,
//     tools: [getCurrentDate],
//   });

//   const langChainMessages = vercelMessages
//     .map(convertVercelMessageToLangChainMessage)
//     .filter((msg): msg is BaseMessage => msg !== undefined);

//   const stream = await agent.stream(
//     { messages: langChainMessages },
//     { streamMode: "messages" }
//   );

//   const newMessages: VercelChatMessage[] = [];

//   const transformedStream = new ReadableStream({
//     async start(controller) {
//       try {
//         for await (const chunk of stream) {
//           const message = chunk[0];
//           const vercelMessage = convertLangChainMessageToVercelMessage(message);
//           newMessages.push(vercelMessage);
//           controller.enqueue(vercelMessage);
//         }
//         controller.close();
//       } catch (error) {
//         controller.error(error);
//       }
//     },
//   });

//   const uiStream = toUIMessageStream(transformedStream);

//   return new StreamingTextResponse(uiStream, {}, {
//     async onCompletion() {
//       const allMessages = [...vercelMessages, ...newMessages];
//       await saveChat({
//         chatId,
//         userId,
//         messages: allMessages,
//       });
//     },
//   });
// }
