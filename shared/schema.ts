import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isFinancialPlanner: boolean("is_financial_planner").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit",
  "investment",
  "other",
]);

// Financial accounts (checking, savings, credit cards, etc.)
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget categories (envelopes)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  budgeted: decimal("budgeted", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: decimal("sort_order", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  date: timestamp("date").notNull(),
  payee: varchar("payee", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  isTransfer: boolean("is_transfer").default(false).notNull(),
  transferId: varchar("transfer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget sharing - allows users to share their budgets with financial planners
export const budgetShares = pgTable("budget_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: varchar("shared_with_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  sharedBudgets: many(budgetShares, { relationName: "sharedBudgets" }),
  budgetsSharedWithMe: many(budgetShares, { relationName: "budgetsSharedWithMe" }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetSharesRelations = relations(budgetShares, ({ one }) => ({
  user: one(users, {
    fields: [budgetShares.userId],
    references: [users.id],
    relationName: "sharedBudgets",
  }),
  sharedWithUser: one(users, {
    fields: [budgetShares.sharedWithUserId],
    references: [users.id],
    relationName: "budgetsSharedWithMe",
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAccount = typeof accounts.$inferInsert;
export type Account = typeof accounts.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertBudgetShare = typeof budgetShares.$inferInsert;
export type BudgetShare = typeof budgetShares.$inferSelect;

// Zod schemas for validation
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  balance: z.coerce.number().transform(val => val.toString()),
});

export const updateAccountSchema = insertAccountSchema.partial();

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  budgeted: z.coerce.number().transform(val => val.toString()),
  sortOrder: z.coerce.number().transform(val => val.toString()),
});

export const updateCategorySchema = insertCategorySchema.partial();

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().or(z.date()),
  amount: z.coerce.number().transform(val => val.toString()),
});

export const updateTransactionSchema = insertTransactionSchema.omit({
  accountId: true,
  categoryId: true,
}).partial();

export const insertBudgetShareSchema = createInsertSchema(budgetShares).omit({
  id: true,
  userId: true,
  createdAt: true,
});
