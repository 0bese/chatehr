// import { google } from "@ai-sdk/google";

// import {
//   convertToModelMessages,
//   stepCountIs,
//   streamText,
//   tool,
//   UIMessage,
// } from "ai";
// import { z } from "zod";
// import { MultiServerMCPClient } from "@langchain/mcp-adapters";
// import { experimental_createMCPClient as createMCPClient } from "ai";
// import { createResource } from "@/lib/actions/resources";
// import { findRelevantContent } from "@/lib/ai/embedding";
// import * as mathjs from "mathjs";

// export const maxDuration = 30;

// // import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// // const gateway = createOpenAICompatible({
// //   name: "moonshotai/kimi-k2",
// //   apiKey: process.env.KIMIK2,
// //   baseURL: "https://api.moonshot.ai/v1",
// // });

// // gateway("kimi-k2-0711-preview");

// function convertMCPToolToAiTool(mcpTool: any) {
//   return {
//     [mcpTool.name]: tool({
//       description: mcpTool.description,
//       inputSchema: mcpTool.schema,
//       execute: async (input: any) => {
//         return await mcpTool.func(input);
//       },
//     }),
//   };
// }

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();

//   // const mcpClient = await createMCPClient({
//   //   transport: {
//   //     type: "sse",
//   //     url: "https://fhir-mcp.onrender.com/mcp",

//   //     // optional: configure HTTP headers, e.g. for authentication
//   //     // headers: {
//   //     //   Authorization: "Bearer ",
//   //     // },
//   //   },
//   // });

//   // const toool = await mcpClient.tools();

//   // console.log("tools: ", toool.get_patient);

//   const client = new MultiServerMCPClient({
//     // Global tool configuration options
//     // Whether to throw on errors if a tool fails to load (optional, default: true)
//     throwOnLoadError: true,
//     // Whether to prefix tool names with the server name (optional, default: false)
//     prefixToolNameWithServerName: false,
//     // Optional additional prefix for tool names (optional, default: "")
//     additionalToolNamePrefix: "",

//     // Use standardized content block format in tool outputs
//     useStandardContentBlocks: true,

//     // Server configuration
//     mcpServers: {
//       // how to force SSE, for old servers that are known to only support SSE (streamable HTTP falls back automatically if unsure)
//       "fhir-mcp": {
//         url: "https://fhir-mcp.onrender.com/mcp",
//         automaticSSEFallback: false,
//       },
//     },
//   });

//   const tools = await client.getTools();

//   const aiTools = Object.assign({}, ...tools.map(convertMCPToolToAiTool));

//   console.log("aisdktools: ", JSON.stringify(aiTools.get_patient, null, 2));

//   const result = streamText({
//     model: google("gemini-2.5-flash"),
//     system: `You are a helpful assistant. `,
//     // Check your knowledge base before answering any questions.
//     // Only respond to questions using information from tool calls.
//     // if no relevant information is found in the tool calls, respond, "Sorry, I don't know.",
//     // prompt:
//     //   "A taxi driver earns $9461 per 1-hour of work." +
//     //   "If he works 12 hours a day and in 1 hour " +
//     //   "he uses 12 liters of petrol with a price  of $134 for 1 liter. " +
//     //   "How much money does he earn in one day?",

//     messages: convertToModelMessages(messages),
//     stopWhen: stepCountIs(10),
//     tools: {
//       ...aiTools,
//       calculate: tool({
//         description:
//           "A tool for evaluating mathematical expressions. " +
//           "Example expressions: " +
//           "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
//         inputSchema: z.object({ expression: z.string() }),
//         execute: async ({ expression }) => mathjs.evaluate(expression),
//       }),
//       // addResource: tool({
//       //   description: `add a resource to your knowledge base.
//       //     If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
//       //   inputSchema: z.object({
//       //     content: z
//       //       .string()
//       //       .describe("the content or resource to add to the knowledge base"),
//       //   }),
//       //   execute: async ({ content }) => createResource({ content }),
//       // }),
//
//     },
//     // onFinish: async () => {
//     //   await mcpClient.close();
//     // },
//   });

//   return result.toUIMessageStreamResponse({
//     sendReasoning: true,
//     sendSources: true,
//   });
// }

import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

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

  // const tools = await client.getTools();
  // const aiTools = Object.assign({}, ...tools.map(convertMCPToolToAiTool));

  // console.log("aisdktools: ", JSON.stringify(aiTools.get_patient, null, 2));

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are a helpful assistant.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      // ...aiTools,
      calculate: tool({
        description:
          "A tool for evaluating mathematical expressions. " +
          "Example expressions: " +
          "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
        inputSchema: z.object({ expression: z.string() }),
        execute: async ({ expression }) => {
          // You'll need to import mathjs or implement this
          // const mathjs = require('mathjs');
          // return mathjs.evaluate(expression);
          return `Result: ${expression}`;
        },
      }),
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
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
