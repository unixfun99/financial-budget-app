import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  datetime,
  json,
  index,
  decimal,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: datetime("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (mandatory for Replit Auth)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  isFinancialPlanner: boolean("is_financial_planner").default(false).notNull(),
  subscriptionId: varchar("subscription_id", { length: 36 }), // Reference to active subscription
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // Stripe customer ID for payments
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

export const accountTypeEnum = mysqlEnum("account_type", [
  "checking",
  "savings",
  "credit",
  "investment",
  "other",
]);

// Financial accounts (checking, savings, credit cards, etc.)
export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  connectionType: varchar("connection_type", { length: 50 }).default("none"), // none, simplefin, plaid
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

// Budget categories (envelopes)
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  parentCategoryId: varchar("parent_category_id", { length: 36 }).references(() => categories.id, { onDelete: "cascade" }), // For subcategories
  budgeted: decimal("budgeted", { precision: 12, scale: 2 }).default("0").notNull(),
  sortOrder: decimal("sort_order", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

// Transactions
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id, { onDelete: "set null" }),
  date: datetime("date").notNull(),
  payee: varchar("payee", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  isTransfer: boolean("is_transfer").default(false).notNull(),
  transferId: varchar("transfer_id", { length: 36 }),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

// Budget sharing - allows users to share their budgets with financial planners
export const budgetShares = mysqlTable("budget_shares", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: varchar("shared_with_user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: datetime("created_at").defaultNow(),
});

// SimpleFIN bank connections - stores encrypted access URLs for bank syncing
export const simplefinConnections = mysqlTable("simplefin_connections", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  accessUrl: text("access_url").notNull(), // Encrypted SimpleFIN access URL with embedded credentials
  connectionName: varchar("connection_name", { length: 255 }), // User-friendly name
  lastSync: datetime("last_sync"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

export const importSourceEnum = mysqlEnum("import_source", [
  "ynab_json",
  "ynab_csv",
  "actual_budget",
  "simplefin",
  "csv",
]);

// Import logs - tracks all imports from external sources
export const importLogs = mysqlTable("import_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  source: importSourceEnum("source").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  accountsImported: decimal("accounts_imported", { precision: 10, scale: 0 }).default("0").notNull(),
  transactionsImported: decimal("transactions_imported", { precision: 10, scale: 0 }).default("0").notNull(),
  categoriesImported: decimal("categories_imported", { precision: 10, scale: 0 }).default("0").notNull(),
  status: varchar("status", { length: 50 }).default("success").notNull(), // success, partial, failed
  errorMessage: text("error_message"),
  createdAt: datetime("created_at").defaultNow(),
});

// User subscriptions
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  plan: varchar("plan", { length: 50 }).notNull(), // free, user ($1/month), planner ($5/month)
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, canceled, expired
  currentPeriodEnd: datetime("current_period_end"),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow(),
});

// Coupon codes
export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`UUID()`),
  code: varchar("code", { length: 50 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).notNull(), // user or planner
  discountType: varchar("discount_type", { length: 20 }).notNull(), // percent or fixed
  discountValue: decimal("discount_value", { precision: 8, scale: 2 }).notNull(),
  durationMonths: decimal("duration_months", { precision: 5, scale: 0 }).notNull(), // number of months free/discounted
  maxUses: decimal("max_uses", { precision: 10, scale: 0 }), // null = unlimited
  currentUses: decimal("current_uses", { precision: 10, scale: 0 }).default("0").notNull(),
  expiresAt: datetime("expires_at"),
  createdAt: datetime("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  sharedBudgets: many(budgetShares, { relationName: "sharedBudgets" }),
  budgetsSharedWithMe: many(budgetShares, { relationName: "budgetsSharedWithMe" }),
  simplefinConnections: many(simplefinConnections),
  importLogs: many(importLogs),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const simplefinConnectionsRelations = relations(simplefinConnections, ({ one }) => ({
  user: one(users, {
    fields: [simplefinConnections.userId],
    references: [users.id],
  }),
}));

export const importLogsRelations = relations(importLogs, ({ one }) => ({
  user: one(users, {
    fields: [importLogs.userId],
    references: [users.id],
  }),
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

export type InsertSimplefinConnection = typeof simplefinConnections.$inferInsert;
export type SimplefinConnection = typeof simplefinConnections.$inferSelect;

export type InsertImportLog = typeof importLogs.$inferInsert;
export type ImportLog = typeof importLogs.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertCoupon = typeof coupons.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;

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

export const insertSimplefinConnectionSchema = createInsertSchema(simplefinConnections).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImportLogSchema = createInsertSchema(importLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  accountsImported: z.coerce.number().transform(val => val.toString()),
  transactionsImported: z.coerce.number().transform(val => val.toString()),
  categoriesImported: z.coerce.number().transform(val => val.toString()),
});
