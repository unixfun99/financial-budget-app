import {
  users,
  accounts,
  categories,
  transactions,
  budgetShares,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type BudgetShare,
  type InsertBudgetShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Account operations
  getAccounts(userId: string): Promise<Account[]>;
  getAccount(id: string, userId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, userId: string, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string, userId: string): Promise<boolean>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, userId: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: string, accountId?: string): Promise<Transaction[]>;
  getTransaction(id: string, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, userId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;
  
  // Budget sharing operations
  getBudgetShares(userId: string): Promise<BudgetShare[]>;
  getSharedBudgets(financialPlannerId: string): Promise<BudgetShare[]>;
  createBudgetShare(share: InsertBudgetShare): Promise<BudgetShare>;
  deleteBudgetShare(userId: string, sharedWithUserId: string): Promise<boolean>;
  
  // Financial planner operations
  getFinancialPlanners(): Promise<User[]>;
  updateUserRole(userId: string, isFinancialPlanner: boolean): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Account operations
  async getAccounts(userId: string): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: string, userId: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, userId: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const existing = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return undefined;
    }
    
    const [updated] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return updated;
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, userId: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return undefined;
    }
    
    const [updated] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Transaction operations
  async getTransactions(userId: string, accountId?: string): Promise<Transaction[]> {
    const conditions = accountId
      ? and(eq(transactions.userId, userId), eq(transactions.accountId, accountId))
      : eq(transactions.userId, userId);
    
    return await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string, userId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, userId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return undefined;
    }
    
    const [updated] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Budget sharing operations
  async getBudgetShares(userId: string): Promise<BudgetShare[]> {
    return await db
      .select()
      .from(budgetShares)
      .where(eq(budgetShares.userId, userId));
  }

  async getSharedBudgets(financialPlannerId: string): Promise<BudgetShare[]> {
    return await db
      .select()
      .from(budgetShares)
      .where(eq(budgetShares.sharedWithUserId, financialPlannerId));
  }

  async createBudgetShare(share: InsertBudgetShare): Promise<BudgetShare> {
    const [newShare] = await db.insert(budgetShares).values(share).returning();
    return newShare;
  }

  async deleteBudgetShare(userId: string, sharedWithUserId: string): Promise<boolean> {
    const result = await db
      .delete(budgetShares)
      .where(
        and(
          eq(budgetShares.userId, userId),
          eq(budgetShares.sharedWithUserId, sharedWithUserId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Financial planner operations
  async getFinancialPlanners(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isFinancialPlanner, true));
  }

  async updateUserRole(userId: string, isFinancialPlanner: boolean): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isFinancialPlanner, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
