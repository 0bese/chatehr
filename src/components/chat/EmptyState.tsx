"use client";

import { Suspense } from "react";

export function EmptyState() {
  const suggestions = [
    "What are the active conditions of this patient?",
    "What active medications is this patient on?",
    "Give me a summary about this patient",
    "What are the list of all the patient's conditions?",
    "Give me a summary about this patient's diagnostic report",
  ];

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 flex flex-col items-start justify-center min-h-[calc(100vh-16rem)] py-16 text-blue-950 dark:text-blue-50">
      <div className="w-full space-y-6 px-4">
        <h2 className="text-3xl font-semibold">
          How can I help you {practitioner first name}
        </h2>

        {/* Suggestions */}
        <div className="space-y-0">
          {suggestions.map((suggestion, index) => (
            <div key={index}>
              <button
                className="w-full justify-start h-auto p-4 text-left hover:bg-accent border border-transparent hover:border-border hover:text-blue-950/80 dark:hover:text-blue-100 rounded-none bg-transparent transition-colors"
                // onClick={() => setMessage && setMessage(suggestion)}
              >
                <span>{suggestion}</span>
              </button>
              {index < suggestions.length - 1 && (
                <div className="h-px bg-gray-200 dark:bg-gray-700 opacity-30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
