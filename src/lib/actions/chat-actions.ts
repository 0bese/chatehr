// lib/actions/chat-actions.ts
"use server";

import {
  getUserChats,
  createChat,
  deleteChat,
  updateChatTitle,
  togglePinChat,
} from "./chat";
import { getCurrentUser } from "@/lib/auth";

export async function fetchUserChats() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthenticated" };

    const chats = await getUserChats(user.practitionerId);
    return { success: true, data: chats };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}

export async function createNewChat(title?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthenticated" };

    const chatId = await createChat({
      practitionerId: user.practitionerId,
      title: title || "New Chat",
    });

    return { success: true, chatId };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to create chat" };
  }
}

export async function deleteChatAction(chatId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthenticated" };

    await deleteChat({ chatId, practitionerId: user.practitionerId });
    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}

export async function updateChatTitleAction(chatId: string, title: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthenticated" };

    await updateChatTitle({
      chatId,
      practitionerId: user.practitionerId,
      title,
    });
    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to update chat title" };
  }
}

export async function togglePinChatAction(chatId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthenticated" };

    await togglePinChat({ chatId, practitionerId: user.practitionerId });
    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to pin chat" };
  }
}
