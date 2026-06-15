import { pgTable, uuid, text, varchar, integer, real, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  highestWpm: integer('highest_wpm').notNull().default(0),
  highestAccuracy: real('highest_accuracy').notNull().default(0),
  gamesPlayed: integer('games_played').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Friends junction table (bidirectional relations)
export const friends = pgTable('friends', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: uuid('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.friendId] })
]);

// Friend Requests junction table
export const friendRequests = pgTable('friend_requests', {
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.senderId, table.receiverId] })
]);

// Game Results table
export const gameResults = pgTable('game_results', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  difficulty: varchar('difficulty', { length: 50 }).notNull(), // 'easy' | 'normal' | 'hard'
  timeLimit: integer('time_limit').notNull(),
  gameMode: varchar('game_mode', { length: 50 }).notNull(), // 'single' | 'multi'
  wpm: real('wpm').notNull().default(0),
  accuracy: real('accuracy').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Infer types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Friend = typeof friends.$inferSelect;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;
