"use client";

import { useState, useEffect } from "react";
import { resources } from "@/lib/db/schema/resources";
import { InferSelectModel } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, FileText, Calendar, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CollectionsListProps {
  refreshTrigger?: number;
}

export function CollectionsList({ refreshTrigger = 0 }: CollectionsListProps) {
  const [collections, setCollections] = useState<InferSelectModel<typeof resources>[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCollections();
  }, [refreshTrigger]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      } else {
        console.error("Failed to fetch collections");
        setCollections([]);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections(prev => prev.filter(collection => collection.id !== id));
      } else {
        console.error("Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading collections...</div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
        <p className="text-muted-foreground mb-4">
          Upload your first collection to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCollections.map((collection) => (
          <Card key={collection.id} className="relative group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">
                    Collection {collection.id.slice(0, 8)}...
                  </CardTitle>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                      disabled={deletingId === collection.id}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this collection? This action cannot be undone.
                        The collection and all its embeddings will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(collection.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDistanceToNow(new Date(collection.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Content preview: {collection.content.slice(0, 100)}...
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Size: {(collection.content.length / 1024).toFixed(1)} KB
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Embedded
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}