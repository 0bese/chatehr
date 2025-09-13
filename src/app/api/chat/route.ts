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
import {
  createChat,
  loadChat,
  saveChat,
  verifyChatAccess,
} from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";

import { NextRequest } from "next/server";
import z from "zod";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { convertMCPToolToAiTool } from "@/lib/utils";
import { findRelevantContent } from "@/lib/ai/embedding";
export const maxDuration = 30;

// const client = new MultiServerMCPClient({
//   throwOnLoadError: true,
//   prefixToolNameWithServerName: false,
//   additionalToolNamePrefix: "",
//   useStandardContentBlocks: true,

//   mcpServers: {
//     "fhir-mcp": {
//       url: "https://fhir-mcp.onrender.com/mcp",
//       automaticSSEFallback: false,
//     },
//   },
// });

// const toools = await client.getTools();
// console.log(toools);
// const aiTools = Object.assign({}, ...toools.map(convertMCPToolToAiTool));

// const tools = {
//   ...aiTools,
//   getCurrentDate: tool({
//     description: "Get the current date and time with timezone information",
//     inputSchema: z.object({}),
//     execute: async () => {
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
//   }),
//   web_search: google.tools.googleSearch({}),
//   urlContext: google.tools.urlContext
// };

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
    let chatId = a.id;
    console.log(chatId);

    // Verify the chat exists and belongs to this practitioner
    const chatExists = await verifyChatAccess({
      id: chatId,
      practitionerId: user.practitionerId,
    });

    if (!chatExists) {
      chatId = await createChat({
        practitionerId: user.practitionerId,
        title: "New Chat",
      });
    }

    // Load previous messages
    const previousMessages = await loadChat({
      id: chatId,
      practitionerId: user.practitionerId,
    });

    // Append new message
    const messages = [...previousMessages, message].filter(Boolean);

    // const validatedMessages = await validateUIMessages({
    //   messages,
    //   tools,
    // })

    // Validate messages
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: modelMessages,
      tools: {
        getInformation: tool({
          description: `get information from your knowledge base to answer questions related to health. USE THE INFORMATION FROM THE KNOWLEDGE BASE. `,
          inputSchema: z.object({
            question: z.string().describe("the users question"),
          }),
          execute: async ({ question }) => findRelevantContent(question),
        }),
      },
      // tools,
      stopWhen: stepCountIs(10),
      experimental_transform: smoothStream({
        delayInMs: 20, // optional: defaults to 10ms
        chunking: "word", // optional: defaults to 'word'
      }),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: true,
          },
        },
      },
    });
    return result.toUIMessageStreamResponse({
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      sendReasoning: true,
      sendSources: true,
      onFinish: async ({ messages: updatedMessages }) => {
        const fullMessages = [...messages, ...updatedMessages];
        await saveChat({
          chatId,
          practitionerId: user.practitionerId,
          messages: fullMessages,
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
  console.log("chat id :", chatId);

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
