"use client";
import { PanelLeft, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { useCurrentChatStateSafe } from "@/components/ChatStateContext";

type ChatControlsProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export function ChatControls({
  sidebarCollapsed,
  setSidebarCollapsed,
}: ChatControlsProps) {
  const pathname = usePathname();
  const { messageCount } = useCurrentChatStateSafe();

  // Check if we're on a chat page
  const isChatPage = pathname?.startsWith("/chat/");
  const isNewChat = pathname === "/chat/new";

  // Disable new chat button if we're on a new chat with 0 messages
  const isNewChatDisabled = isNewChat || (isChatPage && messageCount === 0);

  return (
    <TooltipProvider>
      <div className="absolute left-2.5 top-2.5 z-50">
        <div className="flex items-center gap-0 bg-background/80 backdrop-blur-sm rounded-sm p-1 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <PanelLeft
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    sidebarCollapsed ? "rotate-180" : "rotate-0"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle Sidebar (Cmd/Ctrl + B)</p>
            </TooltipContent>
          </Tooltip>
          {sidebarCollapsed && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => {
                  // Expand sidebar if collapsed and focus search
                  setSidebarCollapsed(false);
                  setTimeout(() => {
                    const searchInput = document.querySelector(
                      'input[placeholder="Search your threads..."]'
                    ) as HTMLInputElement;
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }, 300);
                }}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isNewChatDisabled}
                className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => {
                  // Navigate to new chat - expand sidebar and trigger new chat
                  setSidebarCollapsed(false);
                  setTimeout(() => {
                    const newChatButton = Array.from(
                      document.querySelectorAll("button")
                    ).find((btn) => btn.textContent?.includes("New Chat"));
                    if (newChatButton) {
                      newChatButton.click();
                    }
                  }, 300);
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
