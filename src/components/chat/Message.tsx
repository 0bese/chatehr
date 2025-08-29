"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message";
import { Tool } from "@/components/prompt-kit/tool";
import type { ToolPart } from "@/components/prompt-kit/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UIMessage, UIMessagePart } from "ai";
import { Check, Copy, RefreshCcw } from "lucide-react";
import { memo, useState } from "react";
import { Image } from "@/components/prompt-kit/image";

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
              className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0 space-y-4"
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
          <>
            {message?.parts
              ?.filter((part: any) => part.type === "file")
              .map((part: any, index: number) => (
                <div
                  key={`file-${index}`}
                  className="group flex w-full flex-col items-end gap-1"
                >
                  <div className="bg-transparent text-primary max-w-[85%] rounded-3xl px-0 py-1 whitespace-pre-wrap sm:max-w-[75%]">
                    {part.mediaType?.startsWith("image/") ? (
                      <Image
                        src={part.url}
                        alt={`attachment-${index}`}
                        className="w-full h-20 rounded-md mt-2"
                      />
                    ) : (
                      <iframe
                        src={part.url}
                        width="100%"
                        height="400"
                        title={`pdf-${index}`}
                        className="mt-2 rounded-md"
                      />
                    )}
                  </div>
                </div>
              ))}
            <div className="group flex w-full flex-col items-end gap-1">
              <div className="bg-muted text-primary flex max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
                {message?.parts
                  ?.filter((part: any) => part.type === "text")
                  .map((part: any, index: number) => (
                    <MessageContent
                      key={`text-${index}`}
                      className="bg-transparent p-0"
                      markdown
                    >
                      {part.text}
                    </MessageContent>
                  ))}
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
          </>
        )}
      </Message>
    );
  }
);

MessageComponent.displayName = "MessageComponent";
