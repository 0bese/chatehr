"use client";
import ChatMain from "./chat-main";
import { Sidebar } from "./sidebar";
import { useState } from "react";
import { ChatControls } from "./chat-controls";
import { ChatHeader } from "./chat-header";
import { UIMessage } from "ai";

export default async function ChatInterface({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex relative  h-screen">
      <ChatControls
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <ChatHeader />
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="border flex-1 m-1 rounded-sm bg-white dark:bg-[#18181B]">
        <ChatMain id={id} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
