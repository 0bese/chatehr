// chat/layout.tsx
"use client";
import { Sidebar } from "@/components/sidebar";
import { useEffect } from "react";
import { ChatControls } from "@/components/chat-controls";
import { ChatHeader } from "@/components/chat-header";
import { FhirClientProvider } from "@/components/fhirClientContext";
import { usePersistentState } from "@/hooks/usePersistentState";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use persistent state for sidebar collapse preference
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState<boolean>(
    "chat-sidebar-collapsed",
    false
  );

  // Add keyboard shortcut for toggling sidebar (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  return (
    <FhirClientProvider>
      <div className="flex relative h-screen">
        <ChatControls
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <ChatHeader />
        <Sidebar collapsed={sidebarCollapsed} />
        <div
          className={
            "border m-1 rounded-sm bg-white dark:bg-[#18181B] transition-all duration-300 ease-in-out flex-1"
          }
        >
          {children}
        </div>
      </div>
    </FhirClientProvider>
  );
}
