"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CollectionUpload({ onSuccess, onCancel }: CollectionUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/json',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Please upload a text file, PDF, or JSON file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const content = await readFileContent(selectedFile);

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename: selectedFile.name,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload collection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload collection');
    } finally {
      setUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.type === 'application/pdf') {
        // For PDFs, we'll extract text on the server side
        // For now, send a placeholder that indicates it's a PDF
        resolve(`[PDF_FILE:${file.name}]`);
      } else {
        reader.readAsText(file);
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Collection</CardTitle>
            <CardDescription>
              Upload a text file, PDF, or JSON file to add to your collections
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
            selectedFile ? "border-green-300 bg-green-50" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.pdf,.json,.csv"
            onChange={handleFileInput}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="w-12 h-12 text-green-600 mx-auto" />
              <p className="font-medium text-green-800">{selectedFile.name}</p>
              <p className="text-sm text-green-600">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="mt-2"
              >
                Remove file
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="font-medium">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supports TXT, MD, PDF, JSON, and CSV files up to 10MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Collection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}