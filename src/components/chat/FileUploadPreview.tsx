"use client";

import { Image } from "@/components/prompt-kit/image";
import { Paperclip, X } from "lucide-react";

export function FileUploadPreview({
  files,
  removeFile,
}: {
  files: { file: File; base64: string | null }[];
  removeFile: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {files.map(({ file, base64 }, index) => (
        <div key={index} className="relative group">
          {base64 ? (
            <Image
              src={base64}
              alt={file.name}
              className="h-16 w-16 rounded-md object-cover"
            />
          ) : (
            <div
              className="bg-secondary flex h-16 w-16 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-1">
                <Paperclip className="size-4" />
                <span className="max-w-[120px] truncate text-xs">
                  {file.name}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => removeFile(index)}
            className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-background-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
