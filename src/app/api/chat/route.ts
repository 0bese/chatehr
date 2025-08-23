// import { toUIMessageStream } from "@ai-sdk/langchain";
// import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
// import {
//   createUIMessageStreamResponse,
//   UIMessage as VercelChatMessage,
// } from "ai";
// import { tool } from "@langchain/core/tools";
// import { createReactAgent } from "@langchain/langgraph/prebuilt";
// import { z } from "zod";

// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// //allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
//   if (message.getType() === "human") {
//     return { content: message.content, role: "user" };
//   } else if (message.getType() === "ai") {
//     return {
//       content: message.content,
//       role: "assistant",
//       tool_calls: (message as AIMessage).tool_calls,
//     };
//   } else {
//     return { content: message.content, role: message.getType() };
//   }
// };

// const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
//   if (message.role === "user") {
//     return new HumanMessage({
//       content: message.parts.map((part) =>
//         part.type === "text"
//           ? { type: "text", text: part.text }
//           : { type: "image_url", image_url: part }
//       ),
//     });
//   } else if (message.role === "assistant") {
//     return new AIMessage(message.parts
//       .map((part) => (part.type === "text" ? part.text : ""))
//       .join(""));
//   }
// };

// export async function POST(req: Request) {
//   const {
//     messages,
//   }: {
//     messages: VercelChatMessage[];
//   } = await req.json();

//   console.log("message from frontend", { ...messages });

//   const model = new ChatGoogleGenerativeAI({
//     model: "gemini-2.5-flash",
//     temperature: 0.3,
//     maxRetries: 2,
//     apiKey: "AIzaSyBVuIeew9r-Om7csU7J9TzHt7NaawrEH3E",
//   });

//   const search = tool(
//     async ({ query }: any) => {
//       if (
//         query.toLowerCase().includes("sf") ||
//         query.toLowerCase().includes("san francisco")
//       ) {
//         return "It's 60 degrees and foggy.";
//       }
//       return "It's 90 degrees and sunny.";
//     },
//     {
//       name: "search",
//       description: "Call to surf the web.",
//       schema: z.object({
//         query: z.string().describe("The query to use in your search."),
//       }),
//     }
//   );

//   const agent = createReactAgent({
//     llm: model,
//     tools: [search],
//   });

//   const stream = await model.stream(
//     messages.map((message) =>
//       message.role == "user"
//         ? new HumanMessage({
//             content: message.parts.map((part) =>
//               part.type === "text"
//                 ? { type: "text", text: part.text }
//                 : { type: "image_url", image_url: part }
//             ),
//           })
//         : new AIMessage(
//             message.parts
//               .map((part) => (part.type === "text" ? part.text : ""))
//               .join("")
//           )
//     )
//   );

//   return createUIMessageStreamResponse({
//     stream: toUIMessageStream(stream),
//   });
// }

import { toUIMessageStream } from "@ai-sdk/langchain";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import {
  createUIMessageStreamResponse,
  UIMessage as VercelChatMessage,
} from "ai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

//allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const runtime = "edge";

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message.getType() === "human") {
    return {
      content: message.content,
      role: "user" as const,
      parts: [{ type: "text", text: message.content }],
    };
  } else if (message.getType() === "ai") {
    const aiMessage = message as AIMessage;

    // Check if this is a tool call message
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      return {
        content: aiMessage.content,
        role: "assistant" as const,
        tool_calls: aiMessage.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.args),
          },
        })),
        parts: [{ type: "text", text: aiMessage.content }],
      };
    }

    return {
      content: aiMessage.content,
      role: "assistant" as const,
      tool_calls: [],
      parts: [{ type: "text", text: aiMessage.content }],
    };
  } else if (message.getType() === "tool") {
    const toolMessage = message as any; // ToolMessage type might be different
    return {
      content: toolMessage.content,
      role: "tool" as const,
      tool_call_id: toolMessage.tool_call_id,
      name: toolMessage.name,
      parts: [{ type: "text", text: toolMessage.content }],
    };
  } else {
    return {
      content: message.content,
      role: message.getType() as "user" | "assistant" | "system" | "tool",
      parts: [{ type: "text", text: message.content }],
    };
  }
};

const convertVercelMessageToLangChainMessage = (
  message: VercelChatMessage
): BaseMessage => {
  if (message.role === "user") {
    return new HumanMessage({
      content: message.parts.map((part) =>
        part.type === "text"
          ? { type: "text", text: part.text }
          : { type: "image_url", image_url: part }
      ),
    });
  } else if (message.role === "assistant") {
    return new AIMessage(
      message.parts
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("")
    );
  } else {
    // Handle other message types by converting them to HumanMessage
    return new HumanMessage({
      content:
        typeof message.parts === "string"
          ? message.parts
          : JSON.stringify(message.parts),
    });
  }
};

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages: VercelChatMessage[];
  } = await req.json();

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxRetries: 2,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    // configuration: {
    //   baseURL: "https://api.moonshot.ai/v1",
    // },
  });

  const getCurrentDate = tool(
    async (): Promise<object> => {
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
    {
      name: "getCurrentDate",
      description: "Get the current date and time with timezone information",
      schema: z.object({}), // no input
    }
  );

  const agent = createReactAgent({
    llm: model,
    tools: [getCurrentDate],
  });

  // Convert Vercel messages to LangChain messages using your helper function
  const langChainMessages = messages
    .map(convertVercelMessageToLangChainMessage)
    .filter((msg): msg is BaseMessage => msg !== undefined);

  // Stream from the agent instead of the model directly
  const stream = await agent.stream(
    { messages: langChainMessages },
    { streamMode: "messages" }
  );

  // Create a transform stream to handle agent output
  const transformedStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          // Extract the message part from each chunk (first element in array)
          const message = chunk[0];
          console.log("message before conversion to vercel message: ", message);

          // Convert LangChain message to Vercel message format
          const vercelMessage = convertLangChainMessageToVercelMessage(message);

          console.log("vercelMessage: ", vercelMessage);
          // Enqueue the converted message
          controller.enqueue(vercelMessage);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(transformedStream),
  });
}
