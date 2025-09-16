CREATE TABLE `chats` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255),
	`pinned` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`chat_id` varchar(36) NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` varchar(36) NOT NULL,
	`chat_id` varchar(36) NOT NULL,
	`stream_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`practitioner_id` varchar(255) NOT NULL,
	`name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_practitioner_id_unique` UNIQUE(`practitioner_id`)
);
--> statement-breakpoint
CREATE TABLE `embeddings` (
	`id` varchar(191) NOT NULL,
	`resource_id` varchar(191) NOT NULL,
	`content` text NOT NULL,
	`embedding` vector(3072) NOT NULL,
	CONSTRAINT `embeddings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` varchar(191) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `chats_user_id_idx` ON `chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages_chat_id_created_at_idx` ON `messages` (`chat_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `streams_chat_id_idx` ON `streams` (`chat_id`);--> statement-breakpoint
CREATE INDEX `resource_id_index` ON `embeddings` (`resource_id`);