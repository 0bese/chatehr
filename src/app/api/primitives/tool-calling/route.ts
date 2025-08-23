import { google } from "@ai-sdk/google";

import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";
import { experimental_createMCPClient as createMCPClient } from "ai";
import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import * as mathjs from "mathjs";

export const maxDuration = 30;

// import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// const gateway = createOpenAICompatible({
//   name: "moonshotai/kimi-k2",
//   apiKey: process.env.KIMIK2,
//   baseURL: "https://api.moonshot.ai/v1",
// });

// gateway("kimi-k2-0711-preview")

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // const mcpClient = await createMCPClient({
  //   transport: {
  //     type: "sse",
  //     url: "https://mcp.api.coingecko.com/sse",

  //     // optional: configure HTTP headers, e.g. for authentication
  //     // headers: {
  //     //   Authorization: "Bearer ",
  //     // },
  //   },
  // });

  // const toool = await mcpClient.tools();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    // prompt:
    //   "A taxi driver earns $9461 per 1-hour of work. " +
    //   "If he works 12 hours a day and in 1 hour " +
    //   "he uses 12 liters of petrol with a price  of $134 for 1 liter. " +
    //   "How much money does he earn in one day?",

    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      // calculate: tool({
      //   description:
      //     "A tool for evaluating mathematical expressions. " +
      //     "Example expressions: " +
      //     "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      //   inputSchema: z.object({ expression: z.string() }),
      //   execute: async ({ expression }) => mathjs.evaluate(expression),
      // }),
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer personal  questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
    // onFinish: async () => {
    //   await mcpClient.close();
    // },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
