"use client";

import ChatMain from "./chat-main";
import { Sidebar } from "./sidebar";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { ChatControls } from "./chat-controls";
import { DefaultChatTransport } from "ai";
import { ChatHeader } from "./chat-header";

export default function ChatInterface() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/primitives/tool-calling",
    }),
  });

  return (
    <div className="flex relative  h-screen">
      <ChatControls
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <ChatHeader />
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="border flex-1 m-1 rounded-sm bg-white dark:bg-[#18181B]">
        <ChatMain />
      </div>
    </div>
  );
}
