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
import { getMCPTools } from "@/lib/mcp/mcpClient";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.practitionerId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
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
      try {
        // Create new chat with proper error handling
        const newChatId = await createChat({
          practitionerId: user.practitionerId,
          title: "New Chat",
        });

        if (newChatId) {
          chatId = newChatId;
        } else {
          throw new Error("Failed to create chat");
        }
      } catch (error) {
        console.error("Error creating chat:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create chat. Please try again." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Load previous messages
    const previousMessages = await loadChat({
      id: chatId,
      practitionerId: user.practitionerId,
    });

    // Create a system message with user context
    const userContextMessage = {
      role: "system",
      content: `SYSTEM CONTEXT: You are operating with authenticated user context.\n\nUSER AUTHENTICATION DETAILS:\n- Practitioner ID: ${
        user.practitionerId
      }\n- Practitioner Name: ${
        user.practitionerName || "Not specified"
      }\n- Patient ID: ${user.patientId || "None selected"}\n- Patient Name: ${
        user.patientName || "None selected"
      }\n- FHIR Server: ${
        user.fhirBaseUrl
      }\n- Authentication: Bearer token available\n\nIMPORTANT INSTRUCTIONS:\n1. You have full access to FHIR tools with authentication\n2. DO NOT ask the user for patient IDs, practitioner IDs, or FHIR server URLs\n3. Use the provided context automatically when calling tools\n4. The user context is available in message._userContext for all tools\n5. You can search for patients, access observations, and perform FHIR operations\n6. Always use the authenticated context - never ask for credentials\n\nWhen the user asks about patients, medical data, or FHIR operations, use the available tools immediately without requesting additional information.`,
      parts: [
        {
          type: "text",
          text: `SYSTEM CONTEXT: You are operating with authenticated user context.\n\nUSER AUTHENTICATION DETAILS:\n- Practitioner ID: ${
            user.practitionerId
          }\n- Practitioner Name: ${
            user.practitionerName || "Not specified"
          }\n- Patient ID: ${
            user.patientId || "None selected"
          }\n- Patient Name: ${
            user.patientName || "None selected"
          }\n- FHIR Server: ${
            user.fhirBaseUrl
          }\n- Authentication: Bearer token available\n\nIMPORTANT INSTRUCTIONS:\n1. You have full access to FHIR tools with authentication\n2. DO NOT ask the user for patient IDs, practitioner IDs, or FHIR server URLs\n3. Use the provided context automatically when calling tools\n4. The user context is available in message._userContext for all tools\n5. You can search for patients, access observations, and perform FHIR operations\n6. Always use the authenticated context - never ask for credentials\n\nWhen the user asks about patients, medical data, or FHIR operations, use the available tools immediately without requesting additional information.`,
        },
      ],
      _userContext: {
        practitionerId: user.practitionerId,
        practitionerName: user.practitionerName,
        patientId: user.patientId,
        patientName: user.patientName,
        fhirBaseUrl: user.fhirBaseUrl,
        accessToken: user.accessToken,
      },
    };

    // Append user context to the message content as a string
    const userContextString = `\n\n[USER CONTEXT - Available for tool access]\n- Practitioner ID: ${
      user.practitionerId
    }\n- Practitioner Name: ${
      user.practitionerName || "Not specified"
    }\n- Patient ID: ${user.patientId || "None selected"}\n- Patient Name: ${
      user.patientName || "None selected"
    }\n- FHIR Server: ${
      user.fhirBaseUrl
    }\n- Authentication: Bearer token available`;

    // Append new message with user context injection
    const enhancedMessage = {
      ...message,
      content: (message.content || "") + userContextString,
      parts: [
        ...(message.parts || []),
        {
          type: "text",
          text: userContextString,
        },
      ],
      _userContext: {
        practitionerId: user.practitionerId,
        practitionerName: user.practitionerName,
        patientId: user.patientId,
        patientName: user.patientName,
        fhirBaseUrl: user.fhirBaseUrl,
        accessToken: user.accessToken,
      },
    };

    // Include the system message with user context
    const messages = [
      ...previousMessages,
      userContextMessage,
      enhancedMessage,
    ].filter(Boolean);

    // Validate messages
    const modelMessages = convertToModelMessages(messages);

    // Get MCP tools from server
    const mcpTools = await getMCPTools();

    // Base tools that should always be available
    const baseTools = {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions related to health. USE THE INFORMATION FROM THE KNOWLEDGE BASE. `,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    };

    // Combine base tools with MCP tools
    const allTools = {
      ...baseTools,
      ...mcpTools,
    };

    console.log("ALL TOOLS", allTools);

    // Log tool availability for debugging (simplified)
    console.log(`Available tools: ${Object.keys(allTools).join(", ")}`);
    if (Object.keys(mcpTools).length > 0) {
      console.log(
        `MCP tools loaded for practitioner: ${user.practitionerId}`
      );
    } else {
      console.log("No MCP tools available, using base tools only");
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: modelMessages,
      tools: allTools,
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
      // Add system prompt to reinforce context usage
      system: `You are a helpful medical assistant with access to FHIR tools and user context. You have been provided with user authentication details and current context in the messages. When answering questions:

      1. Use the provided FHIR tools to access medical data
      2. You already have authentication credentials - don't ask for them
      3. Use the current patient context when available
      4. If you need to search for patients, use the patient search tools
      5. For practitioner-specific queries, use the current practitioner context
      6. Always use the provided FHIR base URL and access token from the context

      IMPORTANT: You have been provided with user context in the messages. This includes:
      - Practitioner ID: ${user.practitionerId}
      - Practitioner Name: ${user.practitionerName || "Not specified"}
      - Patient ID: ${user.patientId || "None selected"}
      - Patient Name: ${user.patientName || "None selected"}
      - FHIR Base URL: ${user.fhirBaseUrl}
      - Authentication Token: Available

      Use the context provided in the system message and user message content when calling tools.`,
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

        // Clean up MCP client if needed (optional)
        // Note: In production, you might want to keep the client alive for reuse
      },
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

// GET endpoint for MCP status and debugging
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.practitionerId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "mcp-status") {
    // Return MCP status with user context info
    try {
      const { getMCPTools } = await import(
        "@/lib/mcp/mcpClient"
      );
      const mcpTools = await getMCPTools();

      const toolList = Object.keys(mcpTools);
      const sampleTool = toolList.length > 0 ? mcpTools[toolList[0]] : null;

      return new Response(
        JSON.stringify({
          status: "success",
          toolCount: toolList.length,
          tools: toolList,
          userContext: {
            practitionerId: user.practitionerId,
            practitionerName: user.practitionerName,
            patientId: user.patientId,
            hasAccessToken: !!user.accessToken,
          },
          sampleTool: sampleTool
            ? {
                name: toolList[0],
                description: sampleTool.description,
                hasExecuteFunction: !!sampleTool.execute,
                isContextEnhanced:
                  sampleTool.description?.includes("User:") || false,
              }
            : null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          userContext: {
            practitionerId: user.practitionerId,
            hasAccessToken: !!user.accessToken,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

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
