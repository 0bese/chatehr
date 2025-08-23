"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container";
import { DotsLoader } from "@/components/prompt-kit/loader";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Tool } from "@/components/prompt-kit/tool";
import type { ToolPart } from "@/components/prompt-kit/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage, UIMessagePart } from "ai";
import {
  AlertTriangle,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Paperclip,
  RefreshCcw,
  Square,
  X,
} from "lucide-react";
import { memo, useState } from "react";
import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from "./prompt-kit/file-upload";
import { Image } from "@/components/prompt-kit/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Switch } from "./ui/switch";

type MessageComponentProps = {
  message: UIMessage;
  isLastMessage: boolean;
  hideToolCall: boolean;
  regenerate: () => void;
};

const renderToolPart = (
  part: UIMessagePart<any, any>,
  index: number
): React.ReactNode => {
  if (part.type !== "dynamic-tool" && !part.type?.startsWith("tool-"))
    return null;
  return <Tool key={`${part.type}-${index}`} toolPart={part as ToolPart} />;
};

const models = [
  "Gemini 2.5 Flash",
  "GPT-4o",
  "GPT-4o Mini",
  "Claude 3.5 Sonnet",
  "Claude 3 Haiku",
  "Llama 3.1 70B",
  "Llama 3.1 8B",
];

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

export const MessageComponent = memo(
  ({
    message,
    isLastMessage,
    hideToolCall,
    regenerate,
  }: MessageComponentProps) => {
    const isAssistant = message?.role === "assistant";
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      const messageText = message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("");
      navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const toolCallParts = message.parts.filter(
      (part: any) =>
        (part.type && part.type.startsWith("tool-")) ||
        (part.type && part.type.startsWith("dynamic-tool"))
    );

    return (
      <Message
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2 px-2 md:px-10",
          isAssistant ? "items-start" : "items-end"
        )}
      >
        {isAssistant ? (
          <div className="group flex w-full flex-col gap-0 space-y-2">
            {!hideToolCall && toolCallParts.length > 0 && (
              <div className="w-full">
                {toolCallParts.map((part: any, index: number) =>
                  renderToolPart(part, index)
                )}
              </div>
            )}
            <MessageContent
              className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0"
              markdown
            >
              {message?.parts
                .filter((part: any) => part.type === "text")
                .map((part: any) => part.text)
                .join("")}
            </MessageContent>

            <MessageActions
              className={cn(
                "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                isLastMessage && "opacity-100"
              )}
            >
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button variant="ghost" onClick={handleCopy} size="icon">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </MessageAction>
              <MessageAction tooltip="Regenerate" delayDuration={100}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => regenerate()}
                >
                  <RefreshCcw />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        ) : (
          <div className="group flex w-full flex-col items-end gap-1">
            <div className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
              {message?.parts?.map((part: any, index: number) => {
                if (part.type === "text") {
                  return (
                    <MessageContent
                      key={`text-${index}`}
                      className="bg-transparent p-0"
                      markdown
                    >
                      {part.text}
                    </MessageContent>
                  );
                }
                if (
                  part.type === "file" &&
                  part.mediaType?.startsWith("image/")
                ) {
                  return (
                    <Image
                      key={`image-${index}`}
                      src={part.url}
                      alt={`attachment-${index}`}
                      className="max-w-full h-auto rounded-md mt-2"
                    />
                  );
                }
                if (
                  part.type === "file" &&
                  part.mediaType === "application/pdf"
                ) {
                  return (
                    <iframe
                      key={`pdf-${index}`}
                      src={part.url}
                      width="100%"
                      height="400"
                      title={`pdf-${index}`}
                      className="mt-2 rounded-md"
                    />
                  );
                }
                return null;
              })}
            </div>
            <MessageActions
              className={cn(
                "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              )}
            >
              <MessageAction tooltip="Edit" delayDuration={100}>
                <Button
                  variant="ghost"
                  onClick={handleCopy}
                  size="icon"
                  className=""
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </MessageAction>
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button
                  variant="ghost"
                  onClick={handleCopy}
                  size="icon"
                  className=""
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        )}
      </Message>
    );
  }
);

MessageComponent.displayName = "MessageComponent";

const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-2 md:px-10">
    <div className="group flex w-full flex-col gap-0">
      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
        <DotsLoader />
      </div>
    </div>
  </Message>
));

LoadingMessage.displayName = "LoadingMessage";

const ErrorMessage = memo(({ error }: { error: Error }) => (
  <Message className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col items-start gap-0">
      <div className="text-primary flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-red-300 bg-red-300/20 px-2 py-1">
        <AlertTriangle size={16} className="text-red-500" />
        <p className="text-red-500">{error.message}</p>
      </div>
    </div>
  </Message>
));

ErrorMessage.displayName = "ErrorMessage";

function ChatMain() {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<{ file: File; base64: string | null }[]>(
    []
  );
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
  const [hideToolCall, setHideToolCall] = useState(false);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/primitives/tool-calling", // Changed to match the simpler example
      // api: "/api/chat", // Changed to match the simpler example
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

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
      // Convert files to the format expected by the backend
      const fileParts =
        files.length > 0 ? await convertFilesToDataURLs(files) : [];

      // Create the multimodal message
      const messageParts = [
        { type: "text" as const, text: input },
        ...fileParts,
      ];

      // Send the message with multimodal content
      sendMessage({
        role: "user",
        parts: messageParts,
      });

      // Clear input and files
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
    <div className="flex h-full flex-col overflow-hidden">
      <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto">
        <ChatContainerContent className="space-y-12 px-4 py-12">
          {messages.length === 0 && (
            <div className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
              <div className="text-foreground mb-2 font-medium">
                Try asking:
              </div>
              <ul className="list-inside list-disc space-y-1">
                <li>what's the current date?</li>
                <li>what time is it in Tokyo?</li>
                <li>give me the current time in Europe/Paris</li>
                <li>upload an image and ask about it</li>
                <li>upload a PDF and ask questions about it</li>
              </ul>
            </div>
          )}

          {messages?.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            return (
              <MessageComponent
                key={message.id}
                message={message}
                isLastMessage={isLastMessage}
                hideToolCall={hideToolCall}
                regenerate={() => regenerate()}
              />
            );
          })}

          {isLoading && <LoadingMessage />}
          {status === "error" && error && <ErrorMessage error={error} />}
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className=" bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3  md:px-5">
        <div className="bg-gray-200/50 dark:bg-background/50 rounded-t-3xl p-2 backdrop-blur-sm mx-auto">
          <FileUpload
            onFilesAdded={handleFilesAdded}
            accept=".jpg,.jpeg,.png,.pdf,.docx,.webp"
          >
            <PromptInput
              value={input}
              onValueChange={setInput}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              className="w-full max-w-(--breakpoint-md) bg-white/20 rounded-2xl shadow-2xl backdrop-blur-lg"
            >
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {files.map(({ file, base64 }, index) => (
                    <div key={index} className="relative group">
                      {base64 ? (
                        <Image
                          src={base64}
                          alt={file.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="bg-secondary flex h-16 w-16 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Paperclip className="size-4" />
                            <span className="max-w-[120px] truncate text-xs">
                              {file.name}
                            </span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <PromptInputTextarea placeholder="Type a message or drop files..." />

              <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
                <PromptInputActions>
                  <PromptInputAction tooltip="Attach files">
                    <FileUploadTrigger asChild>
                      <div className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl">
                        <Paperclip className="text-primary size-5" />
                      </div>
                    </FileUploadTrigger>
                  </PromptInputAction>

                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 hover:bg-white/20 dark:hover:bg-gray-700/30 text-gray-500/80 dark:text-gray-400/80"
                          // disabled={}
                        >
                          <span>{selectedModel}</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {models.map((model) => (
                          <DropdownMenuItem
                            key={model}
                            onClick={() => setSelectedModel(model)}
                            className={
                              selectedModel === model ? "bg-accent" : ""
                            }
                          >
                            {model}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className=" flex justify-center items-center gap-2">
                    <Switch
                      checked={hideToolCall}
                      onCheckedChange={setHideToolCall}
                    />{" "}
                    <span className="text-gray-500/90 text-sm">
                      Hide Tool call
                    </span>
                  </div>
                </PromptInputActions>

                <PromptInputAction
                  tooltip={isLoading ? "Stop generation" : "Send message"}
                >
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleSubmit}
                    disabled={
                      isLoading || (!input.trim() && files.length === 0)
                    }
                  >
                    {isLoading ? (
                      <Square className="size-5 fill-current" />
                    ) : (
                      <ArrowUp className="size-5" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>

            <FileUploadContent>
              <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
                <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
                  <div className="mb-4 flex justify-center">
                    <svg
                      className="text-muted size-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-center text-base font-medium">
                    Drop files to upload
                  </h3>
                  <p className="text-muted-foreground text-center text-sm">
                    Release to add files to your message
                  </p>
                </div>
              </div>
            </FileUploadContent>
          </FileUpload>
        </div>
      </div>
    </div>
  );
}

export default ChatMain;
