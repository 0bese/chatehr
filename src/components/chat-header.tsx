"use client";
import { Settings2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ChatHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Settings2 className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-gray-500/70 dark:text-gray-400/70 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-yellow-500/80" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
