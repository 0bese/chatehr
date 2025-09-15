"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pin, Search, Trash2, Plus } from "lucide-react";
import { Input } from "./ui/input";
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
import { useChatHistory } from "@/hooks/useChatHistory";
import { useChatCreation } from "@/hooks/useChatCreation";

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
    chat: any; // Will be typed from useChatHistory
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
  const [searchQuery, setSearchQuery] = React.useState("");

  // Use React Query for chat history management
  const {
    chats,
    isLoading,
    isFetching,
    error,
    pinChat,
    isPinning,
    deleteChat,
    isDeleting,
  } = useChatHistory();

  // Use React Query for chat creation
  const { mutate: createChat, isPending: isCreatingChat } = useChatCreation();

  /* -------------------------------------------------------------- */
  /* memoised derived data – new array only when chats changes */
  /* -------------------------------------------------------------- */
  const { pinned, unpinned } = React.useMemo(() => {
    const filtered = chats.filter((c) =>
      (c.title || "Untitled Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    return {
      pinned: filtered.filter((c) => c.pinned),
      unpinned: filtered.filter((c) => !c.pinned),
    };
  }, [chats, searchQuery]);

  // Error state
  if (error) {
    console.error("Error loading chats:", error);
  }

  return (
    <div
      className={cn(
        "h-screen p-2 overflow-hidden bg-background transition-all duration-300 ease-in-out",
        collapsed
          ? "w-0 opacity-0 p-0  translate-x-[-100%]"
          : "w-64 opacity-100 translate-x-0"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between h-14 px-2 transition-all duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <h2 className="ml-14 text-xl font-semibold">ChatEHR</h2>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "mt-4 space-y-2 transition-all duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <Button
          onClick={() => createChat("New chat")}
          disabled={isCreatingChat}
          variant="ghost"
          className="w-full justify-start flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md transition-colors h-auto font-normal"
        >
          {isCreatingChat ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              New Chat
            </>
          )}
        </Button>
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

      <div
        className={cn(
          "mt-6 flex-1 overflow-y-auto transition-all duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <h3
          className={cn(
            "text-sm font-semibold text-muted-foreground px-2 mb-2 transition-all duration-300",
            collapsed
              ? "translate-y-[-10px] opacity-0"
              : "translate-y-0 opacity-100"
          )}
        >
          Chat History
        </h3>

        {isLoading ? (
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
                  {pinned.map((chat, index) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "transition-all duration-300 ease-in-out",
                        collapsed
                          ? "opacity-0 translate-x-[-10px]"
                          : "opacity-100 translate-x-0"
                      )}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <ChatItem
                        chat={chat}
                        isActive={currentChatId === chat.id}
                        isDeleting={isDeleting}
                        onPin={pinChat}
                        onDelete={deleteChat}
                      />
                    </div>
                  ))}
                </ul>
              </div>
            )}

            {unpinned.length > 0 && (
              <ul className="space-y-1">
                {unpinned.map((chat, index) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      collapsed
                        ? "opacity-0 translate-x-[-10px]"
                        : "opacity-100 translate-x-0"
                    )}
                    style={{
                      transitionDelay: `${(pinned.length + index) * 50}ms`,
                    }}
                  >
                    <ChatItem
                      chat={chat}
                      isActive={currentChatId === chat.id}
                      isDeleting={isDeleting}
                      onPin={pinChat}
                      onDelete={deleteChat}
                    />
                  </div>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
