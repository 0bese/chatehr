"use client";

import { memo } from "react";
import { Message } from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";

export const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-2 md:px-10">
    <div className="group flex w-full flex-col gap-0">
      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
        <Loader variant="dots" />
      </div>
    </div>
  </Message>
));

LoadingMessage.displayName = "LoadingMessage";
