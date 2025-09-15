"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import {
  ChatContainerRoot,
  ChatContainerContent,
} from "@/components/prompt-kit/chat-container";
import { EmptyState } from "./EmptyState";
import { MessageComponent } from "./Message";
import { LoadingMessage } from "./LoadingMessage";
import { ErrorMessage } from "./ErrorMessage";
import { ChatInput } from "./ChatInput";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentChatState } from "@/components/ChatStateContext";

declare module "ai" {
  interface MessageMetadata {
    chatId?: string;
    // add anything else you plan to send
  }
}

// Helper function to convert files to data URLs for multimodal messages
async function convertFilesToDataURLs(
  files: { file: File; base64: string | null }[]
) {
  return Promise.all(
    files.map(({ file, base64 }) => {
      if (base64) {
        // Image file with base64 already available
        return Promise.resolve({
          type: "file" as const,
          mediaType: file.type,
          url: base64,
        });
      } else {
        // Non-image file, convert to base64
        return new Promise<{
          type: "file";
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              mediaType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    })
  );
}

// put this at the top of the file (after the imports)
function hasMessageContent(msg: UIMessage): boolean {
  if (!msg.parts) return false;
  return msg.parts.some(
    (p) =>
      (p.type === "text" && p.text.trim().length > 0) ||
      p.type === "reasoning" ||
      p.type.startsWith("tool-") ||
      p.type === "dynamic-tool"
  );
}

export function ChatView({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<{ file: File; base64: string | null }[]>(
    []
  );
  const [selectedModel, setSelectedModel] = useState("kimi-K2");
  const [hideToolCall, setHideToolCall] = useState(false);
  const { setMessageCount } = useCurrentChatState();

  const { messages, sendMessage, status, error, regenerate } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Update message count when messages change
  useEffect(() => {
    setMessageCount(messages.length);
  }, [messages, setMessageCount]);

  // Check if the last message is from assistant and has any content
  const lastMessage = messages[messages.length - 1];
  const isLastMessageAssistant = lastMessage?.role === "assistant";
  const hasAssistantContent =
    isLastMessageAssistant &&
    lastMessage?.parts &&
    lastMessage.parts.length > 0 &&
    lastMessage.parts.some(
      (part) =>
        (part.type === "text" && part.text.trim().length > 0) ||
        part.type === "reasoning" ||
        part.type?.startsWith("tool-") ||
        part.type === "dynamic-tool"
    );

  // Show loading only if we're loading AND there's no assistant content yet
  const shouldShowLoading = isLoading && !hasAssistantContent;

  const handleFilesAdded = (newFiles: File[]) => {
    newFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setFiles((prev) => [...prev, { file, base64 }]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles((prev) => [...prev, { file, base64: null }]);
      }
    });
  };

  const handleSubmit = async () => {
    if (!input.trim() && files.length === 0) return;

    try {
      const fileParts =
        files.length > 0 ? await convertFilesToDataURLs(files) : [];

      const messageParts = [
        { type: "text" as const, text: input },
        ...fileParts,
      ];

      sendMessage({
        role: "user",
        parts: messageParts,
      });

      setInput("");
      setFiles([]);
    } catch (error) {
      console.error("Error preparing message:", error);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto">
        <ChatContainerContent className="space-y-2 px-4 py-12 pb-36">
          {messages.length === 0 && <EmptyState />}

          {messages?.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const showActions =
              hasMessageContent(message) &&
              (isLastMessage || message.role === "user");
            return (
              <MessageComponent
                key={message.id}
                message={message}
                isLastMessage={isLastMessage}
                showActions={showActions}
                hideToolCall={hideToolCall}
                regenerate={() => regenerate()}
              />
            );
          })}

          {shouldShowLoading && <LoadingMessage />}
          {status === "error" && error && <ErrorMessage error={error} />}
        </ChatContainerContent>

        <ChatInput
          input={input}
          setInput={setInput}
          files={files}
          handleFilesAdded={handleFilesAdded}
          removeFile={removeFile}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          hideToolCall={hideToolCall}
          setHideToolCall={setHideToolCall}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
        />
      </ChatContainerRoot>
    </div>
  );
}
