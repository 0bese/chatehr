// lib/actions/chats.ts
import { db } from "@/lib/db";
import { chats, messages, streams, users } from "@/lib/db/schema/chat";
import { UIMessage } from "ai";
import { eq, asc, desc, and } from "drizzle-orm";
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

// Utility function to get user's chats
export async function getUserChats(practitionerId: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.practitionerId, practitionerId))
    .limit(1);

  if (!user || user.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, user[0].id))
    .orderBy(asc(chats.updatedAt));
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
