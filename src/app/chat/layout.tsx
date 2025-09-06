"use client";
import { Sidebar } from "@/components/sidebar";
import { useState, useEffect } from "react";
import { ChatControls } from "@/components/chat-controls";
import { ChatHeader } from "@/components/chat-header";
import { FhirClientProvider } from "@/components/fhirClientContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <FhirClientProvider>
      <div className="flex relative h-screen">
        <ChatControls
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <ChatHeader />
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="border flex-1 m-1 rounded-sm bg-white dark:bg-[#18181B]">
          {children}
        </div>
      </div>
    </FhirClientProvider>
  );
}
