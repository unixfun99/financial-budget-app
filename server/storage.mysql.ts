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
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class MySQLDatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }
    
    const userId = userData.id;
    
    // Use atomic INSERT ... ON DUPLICATE KEY UPDATE for MySQL/MariaDB
    await db
      .insert(users)
      .values(userData as any)
      .onDuplicateKeyUpdate({
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      });
    
    // Return the user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
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
    const id = account.id || randomUUID();
    await db.insert(accounts).values({ ...account, id });
    const [newAccount] = await db.select().from(accounts).where(eq(accounts.id, id));
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
    
    await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    
    const [updated] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return updated;
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return false;
    }
    
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return true;
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
    const id = category.id || randomUUID();
    await db.insert(categories).values({ ...category, id });
    const [newCategory] = await db.select().from(categories).where(eq(categories.id, id));
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
    
    await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    
    const [updated] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return updated;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return false;
    }
    
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return true;
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
    const id = transaction.id || randomUUID();
    await db.insert(transactions).values({ ...transaction, id });
    const [newTransaction] = await db.select().from(transactions).where(eq(transactions.id, id));
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
    
    await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    
    const [updated] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return updated;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return false;
    }
    
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return true;
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
    const id = share.id || randomUUID();
    await db.insert(budgetShares).values({ ...share, id });
    const [newShare] = await db.select().from(budgetShares).where(eq(budgetShares.id, id));
    return newShare;
  }

  async deleteBudgetShare(userId: string, sharedWithUserId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(budgetShares)
      .where(
        and(
          eq(budgetShares.userId, userId),
          eq(budgetShares.sharedWithUserId, sharedWithUserId)
        )
      )
      .limit(1);
    
    if (!existing.length) {
      return false;
    }
    
    await db
      .delete(budgetShares)
      .where(
        and(
          eq(budgetShares.userId, userId),
          eq(budgetShares.sharedWithUserId, sharedWithUserId)
        )
      );
    return true;
  }

  // Financial planner operations
  async getFinancialPlanners(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isFinancialPlanner, true));
  }

  async updateUserRole(userId: string, isFinancialPlanner: boolean): Promise<User | undefined> {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!existing.length) {
      return undefined;
    }
    
    await db
      .update(users)
      .set({ isFinancialPlanner, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    const [updated] = await db.select().from(users).where(eq(users.id, userId));
    return updated;
  }

  // SimpleFIN operations
  async getSimplefinConnections(userId: string): Promise<SimplefinConnection[]> {
    return await db
      .select()
      .from(simplefinConnections)
      .where(eq(simplefinConnections.userId, userId));
  }

  async getSimplefinConnection(id: string, userId: string): Promise<SimplefinConnection | undefined> {
    const [connection] = await db
      .select()
      .from(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return connection;
  }

  async createSimplefinConnection(connection: InsertSimplefinConnection): Promise<SimplefinConnection> {
    const id = connection.id || randomUUID();
    await db.insert(simplefinConnections).values({ ...connection, id });
    const [newConnection] = await db.select().from(simplefinConnections).where(eq(simplefinConnections.id, id));
    return newConnection;
  }

  async updateSimplefinConnection(id: string, userId: string, updates: Partial<InsertSimplefinConnection>): Promise<SimplefinConnection | undefined> {
    const existing = await db
      .select()
      .from(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return undefined;
    }
    
    await db
      .update(simplefinConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    
    const [updated] = await db
      .select()
      .from(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return updated;
  }

  async deleteSimplefinConnection(id: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)))
      .limit(1);
    
    if (!existing.length) {
      return false;
    }
    
    await db
      .delete(simplefinConnections)
      .where(and(eq(simplefinConnections.id, id), eq(simplefinConnections.userId, userId)));
    return true;
  }

  // Import log operations
  async createImportLog(log: InsertImportLog): Promise<ImportLog> {
    const id = log.id || randomUUID();
    await db.insert(importLogs).values({ ...log, id });
    const [newLog] = await db.select().from(importLogs).where(eq(importLogs.id, id));
    return newLog;
  }

  async getImportLogs(userId: string): Promise<ImportLog[]> {
    return await db
      .select()
      .from(importLogs)
      .where(eq(importLogs.userId, userId))
      .orderBy(desc(importLogs.createdAt));
  }
}
