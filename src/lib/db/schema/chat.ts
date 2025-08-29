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
