// lib/actions/chats.ts
import { db } from "@/lib/db";
import { chats, messages, streams, users } from "@/lib/db/schema/chat";
import { UIMessage } from "ai";
import { eq, asc, desc, and, count } from "drizzle-orm";
import { generateId } from "ai";

interface CreateChatParams {
  practitionerId: string;
  title?: string;
}

export async function createChat({
  practitionerId,
  title,
}: CreateChatParams): Promise<string> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const id = generateId();

  await db.insert(chats).values({
    id,
    userId: user[0].id,
    title: title || "New Chat",
  });

  return id;
}

export async function loadChat({
  id,
  practitionerId,
}: {
  id: string;
  practitionerId: string;
}): Promise<UIMessage[]> {
  // Join users and chats tables to ensure both practitionerId and chat id match
  const chatWithUser = await db
    .select({
      chatId: chats.id,
      userId: chats.userId,
    })
    .from(chats)
    .innerJoin(users, eq(users.id, chats.userId))
    .where(and(eq(chats.id, id), eq(users.practitionerId, practitionerId)))
    .limit(1);

  // If no matching chat found, return empty array
  if (!chatWithUser || chatWithUser.length === 0) {
    return [];
  }

  // Now we can safely load the messages
  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(asc(messages.createdAt));

  return chatMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts: msg.content as any[],
  }));
}

export async function saveChat({
  chatId,
  practitionerId,
  messages: newMessages,
}: {
  chatId: string;
  practitionerId: string;
  messages: UIMessage[];
}): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    throw new Error("Chat not found or unauthorized");
  }

  // Get existing message IDs (not just count)
  const existingMessageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, chatId));

  const existingIds = new Set(existingMessageIds.map((msg) => msg.id));

  // Only insert messages that don't exist yet (by ID, not by count)
  const newMessagesToInsert = newMessages.filter(
    (msg) => !existingIds.has(msg.id)
  );

  if (newMessagesToInsert.length > 0) {
    await db.insert(messages).values(
      newMessagesToInsert.map((msg) => ({
        id: msg.id,
        chatId,
        role: msg.role,
        content: msg.parts,
      }))
    );
  }

  // Update chat's updatedAt
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

export async function loadStreams({
  chatId,
  practitionerId,
}: {
  chatId: string;
  practitionerId: string;
}): Promise<string[]> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    return [];
  }

  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    return [];
  }

  const chatStreams = await db
    .select()
    .from(streams)
    .where(eq(streams.chatId, chatId))
    .orderBy(asc(streams.createdAt));

  return chatStreams.map((s) => s.streamId);
}

export async function appendStreamId({
  chatId,
  practitionerId,
  streamId,
}: {
  chatId: string;
  practitionerId: string;
  streamId: string;
}): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    throw new Error("Chat not found or unauthorized");
  }

  await db.insert(streams).values({
    id: generateId(),
    chatId,
    streamId,
  });
}

export async function verifyChatAccess({
  id,
  practitionerId,
}: {
  id: string;
  practitionerId: string;
}): Promise<boolean> {
  const chatWithUser = await db
    .select({
      chatId: chats.id,
    })
    .from(chats)
    .innerJoin(users, eq(users.id, chats.userId))
    .where(and(eq(chats.id, id), eq(users.practitionerId, practitionerId)))
    .limit(1);

  return chatWithUser.length > 0;
}

// Add these functions to your lib/actions/chats.ts file

export async function updateChatTitle({
  chatId,
  practitionerId,
  title,
}: {
  chatId: string;
  practitionerId: string;
  title: string;
}): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    throw new Error("Chat not found or unauthorized");
  }

  await db
    .update(chats)
    .set({
      title: title.trim() || "Untitled Chat",
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId));
}

// lib/actions/chats.ts (relevant functions with fixes)

export async function getUserChats(practitionerId: string) {
  console.log("backend", practitionerId);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    return [];
  }

  const userChats = await db
    .select({
      id: chats.id,
      userId: chats.userId,
      title: chats.title,
      pinned: chats.pinned,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      messageCount: count(messages.id),
    })
    .from(chats)
    .leftJoin(messages, eq(chats.id, messages.chatId))
    .where(eq(chats.userId, user[0].id))
    .groupBy(chats.id)
    .orderBy(desc(chats.updatedAt));

  return userChats;
}

export async function deleteChat({
  chatId,
  practitionerId,
}: {
  chatId: string;
  practitionerId: string;
}): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  // Check if chat exists and belongs to user - be explicit about what we select
  const chat = await db
    .select({
      id: chats.id,
      userId: chats.userId,
    })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    throw new Error("Chat not found or unauthorized");
  }

  // Delete related records first (messages and streams)
  await db.delete(streams).where(eq(streams.chatId, chatId));
  await db.delete(messages).where(eq(messages.chatId, chatId));

  // Finally delete the chat
  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function togglePinChat({
  chatId,
  practitionerId,
}: {
  chatId: string;
  practitionerId: string;
}): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  // Get the current pinned status
  const chat = await db
    .select({
      id: chats.id,
      userId: chats.userId,
      pinned: chats.pinned,
    })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.length === 0 || chat[0].userId !== user[0].id) {
    throw new Error("Chat not found or unauthorized");
  }

  // Toggle the pinned status
  await db
    .update(chats)
    .set({
      pinned: !chat[0].pinned,
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId));
}
