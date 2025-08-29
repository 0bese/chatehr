"use client";

export function EmptyState() {
  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
      <div className="text-foreground mb-2 font-medium">Try asking:</div>
      <ul className="list-inside list-disc space-y-1">
        <li>what's the current date?</li>
        <li>what time is it in Tokyo?</li>
        <li>give me the current time in Europe/Paris</li>
        <li>upload an image and ask about it</li>
        <li>upload a PDF and ask questions about it</li>
      </ul>
    </div>
  );
}
