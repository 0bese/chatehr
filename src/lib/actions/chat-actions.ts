// lib/actions/chat-actions.ts
"use server";

import { getUserChats, createChat, deleteChat, updateChatTitle, togglePinChat } from "./chat";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function fetchUserChats() {
  try {
    const { practitionerId } = getCurrentUser();
    const chats = await getUserChats(practitionerId);
    return { success: true, data: chats };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}

export async function createNewChat(title?: string) {
  try {
    const { practitionerId } = getCurrentUser();
    const chatId = await createChat({
      practitionerId,
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
    const { practitionerId } = getCurrentUser();
    await deleteChat({ chatId, practitionerId });

    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}

export async function updateChatTitleAction(chatId: string, title: string) {
  try {
    const { practitionerId } = getCurrentUser();
    await updateChatTitle({ chatId, practitionerId, title });

    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to update chat title" };
  }
}

export async function togglePinChatAction(chatId: string) {
  try {
    const { practitionerId } = getCurrentUser();
    await togglePinChat({ chatId, practitionerId });

    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Failed to pin chat" };
  }
}
