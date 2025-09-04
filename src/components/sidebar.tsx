// components/sidebar-server-action.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Pin, Search, Trash2, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { InferSelectModel } from "drizzle-orm";
import { chats } from "@/lib/db/schema/chat";
import {
  deleteChatAction,
  fetchUserChats,
  togglePinChatAction,
} from "@/lib/actions/chat-actions";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

type SidebarProps = {
  collapsed: boolean;
  currentChatId?: string;
};

export function Sidebar({ collapsed, currentChatId }: SidebarProps) {
  const [chatHistory, setChatHistory] = React.useState<
    InferSelectModel<typeof chats>[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingChatId, setDeletingChatId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        const result = await fetchUserChats();

        if (result.success && result.data) {
          setChatHistory(result.data);
        } else {
          console.error("Failed to fetch chats:", result.error);
          setChatHistory([]);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        setChatHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const handleDelete = async (chatId: string) => {
    try {
      setDeletingChatId(chatId);
      const result = await deleteChatAction(chatId);
      if (result.success) {
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      } else {
        console.error("Failed to delete chat:", result.error);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setDeletingChatId(null);
    }
  };

  const handlePin = async (chatId: string) => {
    try {
      const result = await togglePinChatAction(chatId);
      if (result.success) {
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
          )
        );
      } else {
        console.error("Failed to pin chat:", result.error);
      }
    } catch (error) {
      console.error("Error pinning chat:", error);
    }
  };

  // Filter chats based on search query
  const filteredChats = chatHistory.filter((chat) =>
    (chat.title || "Untitled Chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((chat) => chat.pinned);
  const unpinnedChats = filteredChats.filter((chat) => !chat.pinned);

  const ChatItem = ({ chat }: { chat: InferSelectModel<typeof chats> }) => {
    const isActive = currentChatId === chat.id;
    const isDeleting = deletingChatId === chat.id;

    return (
      <li
        className={cn(
          "flex items-center group rounded-md transition-colors",
          isActive
            ? "bg-primary/10 border-l-2 border-primary"
            : "hover:bg-gray-200 dark:hover:bg-[#2F2F31]",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        <Link
          href={`/chat/${chat.id}`}
          className="p-2 truncate flex-grow flex items-center gap-2"
          title={chat.title || "Untitled Chat"}
        >
          <span className="truncate">{chat.title || "Untitled Chat"}</span>
        </Link>
        <div className="hidden group-hover:flex items-center pr-2 gap-1">
          <Button
            onClick={(e) => {
              e.preventDefault();
              handlePin(chat.id);
            }}
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            title={chat.pinned ? "Unpin chat" : "Pin chat"}
          >
            <Pin
              className={cn(
                "w-3 h-3",
                chat.pinned
                  ? "fill-current text-primary"
                  : "text-muted-foreground"
              )}
            />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20"
                title="Delete chat"
                disabled={isDeleting}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "
                  {chat.title || "Untitled Chat"}"? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(chat.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </li>
    );
  };

  if (collapsed) {
    return null;
  }

  return (
    <div className="w-64 h-screen  p-2 transition-all duration-200 ease-in-out overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-2">
        <h2 className="text-xl font-semibold">ChatEHR</h2>
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-2">
        <Link
          href="/chat"
          className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md transition-colors"
        >
          Collections
        </Link>

        {/* Search */}
        <div className="relative flex items-center pt-2">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search your threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary/50"
          />
        </div>
      </nav>

      {/* Chat History */}
      <div className="mt-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">
          Chat History
        </h3>

        {loading ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            {searchQuery ? "No chats match your search" : "No chats yet"}
          </div>
        ) : (
          <div className="space-y-1">
            {pinnedChats.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                  📌 Pinned
                </h4>
                <ul className="space-y-1">
                  {pinnedChats.map((chat) => (
                    <ChatItem key={chat.id} chat={chat} />
                  ))}
                </ul>
              </div>
            )}

            {unpinnedChats.length > 0 && (
              <ul className="space-y-1">
                {unpinnedChats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
