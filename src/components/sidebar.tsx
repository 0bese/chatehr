"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

/* ------------------------------------------------------------------ */
/* stable helper components                                           */
/* ------------------------------------------------------------------ */
const ChatItem = React.memo(
  ({
    chat,
    isActive,
    isDeleting,
    onPin,
    onDelete,
  }: {
    chat: InferSelectModel<typeof chats>;
    isActive: boolean;
    isDeleting: boolean;
    onPin: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
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
            onPin(chat.id);
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
                Are you sure you want to delete "{chat.title || "Untitled Chat"}
                "? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(chat.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
);
ChatItem.displayName = "ChatItem";

/* ------------------------------------------------------------------ */
/* provider component                                                 */
/* ------------------------------------------------------------------ */
export function Sidebar({ collapsed, currentChatId }: SidebarProps) {
  const [chatHistory, setChatHistory] = React.useState<
    InferSelectModel<typeof chats>[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingChatId, setDeletingChatId] = React.useState<string | null>(
    null
  );

  /* -------------------------------------------------------------- */
  /* only load when the component mounts – not on every route change */
  /* -------------------------------------------------------------- */
  React.useEffect(() => {
    let stale = false;

    (async () => {
      try {
        setLoading(true);
        const result = await fetchUserChats();
        if (stale) return;

        if (result.success && result.data) setChatHistory(result.data);
        else {
          console.error("Failed to fetch chats:", result.error);
          setChatHistory([]);
        }
      } catch (e) {
        console.error("Error loading chats:", e);
        setChatHistory([]);
      } finally {
        if (!stale) setLoading(false);
      }
    })();

    return () => {
      stale = true;
    };
  }, []);

  const handleDelete = React.useCallback(async (chatId: string) => {
    setDeletingChatId(chatId);
    const result = await deleteChatAction(chatId);
    if (result.success)
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
    else console.error("Failed to delete chat:", result.error);
    setDeletingChatId(null);
  }, []);

  const handlePin = React.useCallback(async (chatId: string) => {
    const result = await togglePinChatAction(chatId);
    if (result.success)
      setChatHistory((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c))
      );
    else console.error("Failed to pin chat:", result.error);
  }, []);

  /* -------------------------------------------------------------- */
  /* memoised derived data – new array only when chatHistory changes */
  /* -------------------------------------------------------------- */
  const { pinned, unpinned } = React.useMemo(() => {
    const filtered = chatHistory.filter((c) =>
      (c.title || "Untitled Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    return {
      pinned: filtered.filter((c) => c.pinned),
      unpinned: filtered.filter((c) => !c.pinned),
    };
  }, [chatHistory, searchQuery]);

  if (collapsed) return null;

  return (
    <div className="w-64 h-screen p-2 overflow-hidden bg-background">
      <div className="flex items-center justify-between h-14 px-2">
        <h2 className=" ml-14 text-xl font-semibold">ChatEHR</h2>
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
          href="/collections"
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

      <div className="mt-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">
          Chat History
        </h3>

        {loading ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            Loading chats...
          </div>
        ) : pinned.length + unpinned.length === 0 ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            {searchQuery ? "No chats match your search" : "No chats yet"}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                  📌 Pinned
                </h4>
                <ul className="space-y-1">
                  {pinned.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={currentChatId === chat.id}
                      isDeleting={deletingChatId === chat.id}
                      onPin={handlePin}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </div>
            )}

            {unpinned.length > 0 && (
              <ul className="space-y-1">
                {unpinned.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={currentChatId === chat.id}
                    isDeleting={deletingChatId === chat.id}
                    onPin={handlePin}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
