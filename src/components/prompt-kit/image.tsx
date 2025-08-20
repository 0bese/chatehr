"use client";

import { cn } from "@/lib/utils";

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function Image({ src, alt, className }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-24 w-24 rounded-md object-cover", className)}
    />
  );
}
