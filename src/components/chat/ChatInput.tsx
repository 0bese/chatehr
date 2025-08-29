"use client";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from "@/components/prompt-kit/file-upload";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { FileUploadPreview } from "./FileUploadPreview";

export function ChatInput({
  input,
  setInput,
  files,
  handleFilesAdded,
  removeFile,
  selectedModel,
  setSelectedModel,
  hideToolCall,
  setHideToolCall,
  isLoading,
  handleSubmit,
}: {
  input: string;
  setInput: (input: string) => void;
  files: { file: File; base64: string | null }[];
  handleFilesAdded: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  hideToolCall: boolean;
  setHideToolCall: (hide: boolean) => void;
  isLoading: boolean;
  handleSubmit: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-3xl px-4">
      <div className="bg-gray-200/50 dark:bg-stone-800/70 rounded-t-3xl p-2 backdrop-blur-sm mx-auto">
        <FileUpload
          onFilesAdded={handleFilesAdded}
          accept=".jpg,.jpeg,.png,.pdf,.docx,.webp"
        >
          <PromptInput
            value={input}
            onValueChange={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="w-full max-w-(--breakpoint-md) bg-white/20 rounded-2xl shadow-2xl backdrop-blur-lg "
          >
            {files.length > 0 && (
              <FileUploadPreview files={files} removeFile={removeFile} />
            )}

            <PromptInputTextarea
              className="dark:bg-transparent"
              placeholder="Type a message or drop files..."
            />

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
                  <ModelSelector
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                  />
                </div>
                <div className=" flex justify-center items-center gap-2">
                  <Switch
                    checked={hideToolCall}
                    onCheckedChange={setHideToolCall}
                  />{" "}
                  <span className="text-[#737373] dark:text-[#A1A1A1] text-sm">
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
                  disabled={isLoading || (!input.trim() && files.length === 0)}
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
  );
}
