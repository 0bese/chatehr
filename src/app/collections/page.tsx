"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { CollectionsList } from "@/components/collections/CollectionsList";
import { CollectionUpload } from "@/components/collections/CollectionUpload";
import { Button } from "@/components/ui/button";
import { Plus, Upload, PanelLeft } from "lucide-react";

export default function CollectionsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex relative h-screen">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <PanelLeft />
            </Button>
            <h1 className="text-xl font-semibold">Collections</h1>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Collection
          </Button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {showUpload ? (
            <CollectionUpload
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowUpload(false)}
            />
          ) : (
            <CollectionsList refreshTrigger={refreshTrigger} />
          )}
        </main>
      </div>
    </div>
  );
}
