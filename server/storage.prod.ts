import {
  users,
  accounts,
  categories,
  transactions,
  budgetShares,
  simplefinConnections,
  importLogs,
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
  type SimplefinConnection,
  type InsertSimplefinConnection,
  type ImportLog,
  type InsertImportLog,
} from "@shared/schema.mariadb";
import { db } from "./db.prod";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAccounts(userId: string): Promise<Account[]>;
  getAccount(id: string, userId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, userId: string, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string, userId: string): Promise<boolean>;
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, userId: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  getTransactions(userId: string, accountId?: string): Promise<Transaction[]>;
  getTransaction(id: string, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, userId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;
  getBudgetShares(userId: string): Promise<BudgetShare[]>;
  getSharedBudgets(financialPlannerId: string): Promise<BudgetShare[]>;
  createBudgetShare(share: InsertBudgetShare): Promise<BudgetShare>;
  deleteBudgetShare(userId: string, sharedWithUserId: string): Promise<boolean>;
  getFinancialPlanners(): Promise<User[]>;
  updateUserRole(userId: string, isFinancialPlanner: boolean): Promise<User | undefined>;
  getSimplefinConnections(userId: string): Promise<SimplefinConnection[]>;
  getSimplefinConnection(id: string, userId: string): Promise<SimplefinConnection | undefined>;
  createSimplefinConnection(connection: InsertSimplefinConnection): Promise<SimplefinConnection>;
  updateSimplefinConnection(id: string, userId: string, updates: Partial<InsertSimplefinConnection>): Promise<SimplefinConnection | undefined>;
  deleteSimplefinConnection(id: string, userId: string): Promise<boolean>;
  createImportLog(log: InsertImportLog): Promise<ImportLog>;
  getImportLogs(userId: string): Promise<ImportLog[]>;
}

// Helper to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? await this.getUser(userData.id) : undefined;
    
    if (existingUser) {
      await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
        })
        .where(eq(users.id, userData.id!));
      return (await this.getUser(userData.id!))!;
    } else {
      const id = userData.id || generateUUID();
      await db.insert(users).values({ ...userData, id });
      return (await this.getUser(id))!;
    }
  }

  async getAccounts(userId: string): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: string, userId: string): Promise<Account | undefined> {
    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return result[0];
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = generateUUID();
    await db.insert(accounts).values({ ...account, id });
    return (await this.getAccount(id, account.userId))!;
  }

  async updateAccount(id: string, userId: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    await db
      .update(accounts)
      .set(updates)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return this.getAccount(id, userId);
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return true;
  }

  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = generateUUID();
    await db.insert(categories).values({ ...category, id });
    return (await this.getCategory(id, category.userId))!;
  }

  async updateCategory(id: string, userId: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    await db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return this.getCategory(id, userId);
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return true;
  }

  async getTransactions(userId: string, accountId?: string): Promise<Transaction[]> {
    if (accountId) {
      return db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)))
        .orderBy(desc(transactions.date));
    }
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string, userId: string): Promise<Transaction | undefined> {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = generateUUID();
    await db.insert(transactions).values({ ...transaction, id });
    return (await this.getTransaction(id, transaction.userId))!;
  }

  async updateTransaction(id: string, userId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    await db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return this.getTransaction(id, userId);
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return true;
  }

  async getBudgetShares(userId: string): Promise<BudgetShare[]> {
    return db.select().from(budgetShares).where(eq(budgetShares.userId, userId));
  }

  async getSharedBudgets(financialPlannerId: string): Promise<BudgetShare[]> {
    return db.select().from(budgetShares).where(eq(budgetShares.sharedWithUserId, financialPlannerId));
  }

  async createBudgetShare(share: InsertBudgetShare): Promise<BudgetShare> {
    const id = generateUUID();
    await db.insert(budgetShares).values({ ...share, id });
    const result = await db.select().from(budgetShares).where(eq(budgetShares.id, id));
    return result[0];
  }

  async deleteBudgetShare(userId: string, sharedWithUserId: string): Promise<boolean> {
    await db
      .delete(budgetShares)
      .where(and(eq(budgetShares.userId, userId), eq(budgetShares.sharedWithUserId, sharedWithUserId)));
    return true;
  }

  async getFinancialPlanners(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isFinancialPlanner, true));
  }

  async updateUserRole(userId: string, isFinancialPlanner: boolean): Promise<User | undefined> {
    await db.update(users).set({ isFinancialPlanner }).where(eq(users.id, userId));
    return this.getUser(userId);
  }

  async getSimplefinConnections(userId: string): Promise<SimplefinConnection[]> {
    return db.select().from(simplefinConnections).where(eq(simplefinConnections.userId, userId));
  }

  async getSimplefinConnection(id: string, userId: string): Promise<SimplefinConnection | undefined> {
    const result = await db
      .select()
      .from(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return result[0];
  }

  async createSimplefinConnection(connection: InsertSimplefinConnection): Promise<SimplefinConnection> {
    const id = generateUUID();
    await db.insert(simplefinConnections).values({ ...connection, id });
    return (await this.getSimplefinConnection(id, connection.userId))!;
  }

  async updateSimplefinConnection(id: string, userId: string, updates: Partial<InsertSimplefinConnection>): Promise<SimplefinConnection | undefined> {
    await db
      .update(simplefinConnections)
      .set(updates)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return this.getSimplefinConnection(id, userId);
  }

  async deleteSimplefinConnection(id: string, userId: string): Promise<boolean> {
    await db
      .delete(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return true;
  }

  async createImportLog(log: InsertImportLog): Promise<ImportLog> {
    const id = generateUUID();
    await db.insert(importLogs).values({ ...log, id });
    const result = await db.select().from(importLogs).where(eq(importLogs.id, id));
    return result[0];
  }

  async getImportLogs(userId: string): Promise<ImportLog[]> {
    return db
      .select()
      .from(importLogs)
      .where(eq(importLogs.userId, userId))
      .orderBy(desc(importLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
