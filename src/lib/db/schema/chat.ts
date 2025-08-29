// import {
//   mysqlTable,
//   varchar,
//   text,
//   timestamp,
//   json,
//   index,
//   int,
// } from "drizzle-orm/mysql-core";
// import { sql } from "drizzle-orm";

// // Chats table to store chat metadata with user association
// export const chats = mysqlTable(
//   "chats",
//   {
//     id: varchar("id", { length: 255 }).primaryKey(),
//     userId: varchar("user_id", { length: 255 }).notNull(), // Associate chat with user
//     title: varchar("title", { length: 500 }), // Optional chat title for display
//     messageCount: int("message_count").default(0), // Track message count for UI
//     lastMessageAt: timestamp("last_message_at"), // Last activity timestamp
//     createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
//     updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
//   },
//   (table) => [
//     index("user_id_idx").on(table.userId),
//     index("created_at_idx").on(table.createdAt),
//     index("last_message_at_idx").on(table.lastMessageAt),
//     index("user_created_idx").on(table.userId, table.createdAt),
//   ]
// );

// // Messages table to store individual messages
// export const messages = mysqlTable(
//   "messages",
//   {
//     id: varchar("id", { length: 255 }).primaryKey(),
//     chatId: varchar("chat_id", { length: 255 }).notNull(),
//     role: varchar("role", { length: 50 }).notNull(), // 'user', 'assistant', 'system'
//     content: json("content").notNull(), // Store the full UIMessage content as JSON
//     createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
//   },
//   (table) => [
//     index("chat_id_idx").on(table.chatId),
//     index("created_at_idx").on(table.createdAt),
//   ]
// );

// // Stream IDs table for resumable streams (optional, for resumable stream feature)
// export const streamIds = mysqlTable(
//   "stream_ids",
//   {
//     id: varchar("id", { length: 255 }).primaryKey(),
//     chatId: varchar("chat_id", { length: 255 }).notNull(),
//     streamId: varchar("stream_id", { length: 255 }).notNull(),
//     createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
//   },
//   (table) => [
//     index("chat_id_idx").on(table.chatId),
//     index("stream_id_idx").on(table.streamId),
//   ]
// );

// schema.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  practitionerId: varchar("practitioner_id", { length: 255 })
    .notNull()
    .unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const chats = mysqlTable(
  "chats",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("chats_user_id_idx").on(table.userId)]
);

export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    chatId: varchar("chat_id", { length: 36 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(),
    content: json("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chatId),
    index("messages_chat_id_created_at_idx").on(table.chatId, table.createdAt),
  ]
);

export const streams = mysqlTable(
  "streams",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    chatId: varchar("chat_id", { length: 36 }).notNull(),
    streamId: varchar("stream_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("streams_chat_id_idx").on(table.chatId)]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  streams: many(streams),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one }) => ({
  chat: one(chats, {
    fields: [streams.chatId],
    references: [chats.id],
  }),
}));
