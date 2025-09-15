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

type ChatControlsProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export function ChatControls({
  sidebarCollapsed,
  setSidebarCollapsed,
}: ChatControlsProps) {
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
                <PanelLeft className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  sidebarCollapsed ? "rotate-180" : "rotate-0"
                )} />
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
                onClick={() => alert("Search is not implemented yet.")}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                // disabled={!hasActiveConversation}
                className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                // onClick={createNewChat}
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
