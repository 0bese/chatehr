"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const models = [
  "Gemini 1.5 Flash",
  "GPT-4o",
  "GPT-4o Mini",
  "Claude 3.5 Sonnet",
  "Claude 3 Haiku",
  "Llama 3.1 70B",
  "Llama 3.1 8B",
];

export function ModelSelector({
  selectedModel,
  setSelectedModel,
}: {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 hover:bg-white/20 dark:hover:bg-stone-700/30 text-[#737373]/80 dark:text-[#A1A1A1]"
        >
          <span>{selectedModel}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {models.map((model) => (
          <DropdownMenuItem
            key={model}
            onClick={() => setSelectedModel(model)}
            className={selectedModel === model ? "bg-accent" : ""}
          >
            {model}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
