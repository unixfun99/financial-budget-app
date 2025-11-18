import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertAccountSchema,
  updateAccountSchema,
  insertCategorySchema,
  updateCategorySchema,
  insertTransactionSchema,
  updateTransactionSchema,
  insertBudgetShareSchema,
  insertSimplefinConnectionSchema,
  insertImportLogSchema,
} from "@shared/schema";
import { z } from "zod";
import * as simplefin from "./simplefin";
import * as ynab from "./ynab";
import * as actualbudget from "./actualbudget";

function sanitizeRequestBody(body: any, forbiddenKeys: string[]): any {
  const sanitized = JSON.parse(JSON.stringify(body));
  forbiddenKeys.forEach(key => delete sanitized[key]);
  return sanitized;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(200).json(null);
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account routes
  app.get("/api/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id, createdAt, updatedAt, ...data } = req.body;
      const validated = insertAccountSchema.parse(data);
      const account = await storage.createAccount({ ...validated, userId });
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.patch("/api/accounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const safeData = sanitizeRequestBody(req.body, ['id', 'userId', 'createdAt', 'updatedAt']);
      const validated = updateAccountSchema.parse(safeData);
      const account = await storage.updateAccount(id, userId, validated);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteAccount(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id, createdAt, updatedAt, ...data } = req.body;
      const validated = insertCategorySchema.parse(data);
      const category = await storage.createCategory({ ...validated, userId });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const safeData = sanitizeRequestBody(req.body, ['id', 'userId', 'createdAt', 'updatedAt']);
      const validated = updateCategorySchema.parse(safeData);
      const category = await storage.updateCategory(id, userId, validated);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = req.query.accountId as string | undefined;
      const transactions = await storage.getTransactions(userId, accountId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id, createdAt, updatedAt, ...data } = req.body;
      const validated = insertTransactionSchema.parse(data);
      
      const account = await storage.getAccount(validated.accountId, userId);
      if (!account) {
        return res.status(404).json({ message: "Account not found or does not belong to you" });
      }
      
      if (validated.categoryId) {
        const category = await storage.getCategory(validated.categoryId, userId);
        if (!category) {
          return res.status(404).json({ message: "Category not found or does not belong to you" });
        }
      }
      
      const transactionData = {
        ...validated,
        userId,
        date: typeof validated.date === 'string' ? new Date(validated.date) : validated.date,
      };
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const safeData = sanitizeRequestBody(req.body, ['id', 'userId', 'accountId', 'categoryId', 'createdAt', 'updatedAt']);
      const validated = updateTransactionSchema.parse(safeData);
      
      const updates: any = { ...validated };
      if (validated.date) {
        updates.date = typeof validated.date === 'string' ? new Date(validated.date) : validated.date;
      }
      
      const transaction = await storage.updateTransaction(id, userId, updates);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Budget sharing routes
  app.get("/api/budget-shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shares = await storage.getBudgetShares(userId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching budget shares:", error);
      res.status(500).json({ message: "Failed to fetch budget shares" });
    }
  });

  app.get("/api/shared-budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isFinancialPlanner) {
        return res.status(403).json({ message: "Only financial planners can access shared budgets" });
      }
      
      const shares = await storage.getSharedBudgets(userId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching shared budgets:", error);
      res.status(500).json({ message: "Failed to fetch shared budgets" });
    }
  });

  app.post("/api/budget-shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id, createdAt, ...data } = req.body;
      const validated = insertBudgetShareSchema.parse(data);
      const share = await storage.createBudgetShare({ ...validated, userId });
      res.json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating budget share:", error);
      res.status(500).json({ message: "Failed to create budget share" });
    }
  });

  app.delete("/api/budget-shares/:sharedWithUserId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sharedWithUserId } = req.params;
      const deleted = await storage.deleteBudgetShare(userId, sharedWithUserId);
      if (!deleted) {
        return res.status(404).json({ message: "Budget share not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget share:", error);
      res.status(500).json({ message: "Failed to delete budget share" });
    }
  });

  // Financial planner routes
  app.get("/api/financial-planners", isAuthenticated, async (req: any, res) => {
    try {
      const planners = await storage.getFinancialPlanners();
      res.json(planners);
    } catch (error) {
      console.error("Error fetching financial planners:", error);
      res.status(500).json({ message: "Failed to fetch financial planners" });
    }
  });

  // SimpleFIN routes
  app.post("/api/simplefin/connect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { setupToken, connectionName } = req.body;
      
      if (!setupToken || typeof setupToken !== 'string') {
        return res.status(400).json({ message: "Setup token is required" });
      }
      
      const encryptedAccessUrl = await simplefin.claimSetupToken(setupToken);
      
      const connection = await storage.createSimplefinConnection({
        userId,
        accessUrl: encryptedAccessUrl,
        connectionName: connectionName || 'My Bank',
        isActive: true,
      });
      
      res.json(connection);
    } catch (error) {
      console.error("Error connecting SimpleFIN:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to connect SimpleFIN" });
    }
  });

  app.get("/api/simplefin/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getSimplefinConnections(userId);
      
      const sanitized = connections.map(conn => ({
        id: conn.id,
        connectionName: conn.connectionName,
        lastSync: conn.lastSync,
        isActive: conn.isActive,
        createdAt: conn.createdAt,
      }));
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching SimpleFIN connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/simplefin/sync/:connectionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { connectionId } = req.params;
      
      const connection = await storage.getSimplefinConnection(connectionId, userId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);
      
      const accountSet = await simplefin.fetchAccounts(connection.accessUrl, startDate);
      
      let accountsImported = 0;
      let transactionsImported = 0;
      
      for (const sfAccount of accountSet.accounts) {
        const accountData = simplefin.mapSimplefinAccountToLocal(sfAccount);
        
        const existingAccounts = await storage.getAccounts(userId);
        const existing = existingAccounts.find(a => 
          a.name === accountData.name && a.type === accountData.type
        );
        
        let localAccount;
        if (existing) {
          localAccount = await storage.updateAccount(existing.id, userId, {
            balance: accountData.balance,
          });
        } else {
          localAccount = await storage.createAccount({
            ...accountData,
            userId,
          });
          accountsImported++;
        }
        
        if (!localAccount) {
          console.error(`Failed to create/update account: ${accountData.name}`);
          continue;
        }
        
        for (const sfTxn of sfAccount.transactions) {
          const txnData = simplefin.mapSimplefinTransactionToLocal(sfTxn, localAccount.id, userId);
          
          const existingTxns = await storage.getTransactions(userId);
          const txnExists = existingTxns.some(t => 
            t.accountId === localAccount.id &&
            t.date.getTime() === txnData.date.getTime() &&
            t.amount === txnData.amount &&
            t.payee === txnData.payee
          );
          
          if (!txnExists) {
            await storage.createTransaction(txnData);
            transactionsImported++;
          }
        }
      }
      
      await storage.updateSimplefinConnection(connectionId, userId, {
        lastSync: new Date(),
      });
      
      await storage.createImportLog({
        userId,
        source: 'simplefin',
        accountsImported: accountsImported.toString(),
        transactionsImported: transactionsImported.toString(),
        categoriesImported: '0',
        status: 'success',
      });
      
      res.json({
        success: true,
        accountsImported,
        transactionsImported,
      });
    } catch (error) {
      console.error("Error syncing SimpleFIN:", error);
      
      const userId = req.user.claims.sub;
      await storage.createImportLog({
        userId,
        source: 'simplefin',
        accountsImported: '0',
        transactionsImported: '0',
        categoriesImported: '0',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to sync" });
    }
  });

  app.delete("/api/simplefin/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const deleted = await storage.deleteSimplefinConnection(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SimpleFIN connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // YNAB import routes
  app.post("/api/import/ynab-json", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { budgetData, fileName } = req.body;
      
      if (!budgetData) {
        return res.status(400).json({ message: "Budget data is required" });
      }
      
      const budget = ynab.parseYNABJSON(budgetData);
      
      let accountsImported = 0;
      let transactionsImported = 0;
      let categoriesImported = 0;
      
      const accountIdMap = new Map<string, string>();
      
      if (budget.accounts) {
        for (const ynabAccount of budget.accounts) {
          if (ynabAccount.deleted || ynabAccount.closed) continue;
          
          const accountData = ynab.mapYNABAccountToLocal(ynabAccount);
          const localAccount = await storage.createAccount({
            ...accountData,
            userId,
          });
          accountsImported++;
          accountIdMap.set(ynabAccount.id, localAccount.id);
        }
      }
      
      if (budget.categories) {
        for (const ynabCategory of budget.categories) {
          if (ynabCategory.deleted || ynabCategory.hidden) continue;
          
          const categoryData = ynab.mapYNABCategoryToLocal(ynabCategory, userId);
          await storage.createCategory({
            ...categoryData,
            sortOrder: '0',
          });
          categoriesImported++;
        }
      }
      
      if (budget.transactions) {
        for (const ynabTxn of budget.transactions) {
          if (ynabTxn.deleted) continue;
          
          const localAccountId = accountIdMap.get(ynabTxn.account_id);
          if (!localAccountId) continue;
          
          const txnData = ynab.mapYNABTransactionToLocal(ynabTxn, localAccountId, userId);
          await storage.createTransaction(txnData);
          transactionsImported++;
        }
      }
      
      await storage.createImportLog({
        userId,
        source: 'ynab_json',
        fileName: fileName || 'ynab-import.json',
        accountsImported: accountsImported.toString(),
        transactionsImported: transactionsImported.toString(),
        categoriesImported: categoriesImported.toString(),
        status: 'success',
      });
      
      res.json({
        success: true,
        accountsImported,
        transactionsImported,
        categoriesImported,
      });
    } catch (error) {
      console.error("Error importing YNAB JSON:", error);
      
      const userId = req.user.claims.sub;
      await storage.createImportLog({
        userId,
        source: 'ynab_json',
        fileName: req.body.fileName || 'ynab-import.json',
        accountsImported: '0',
        transactionsImported: '0',
        categoriesImported: '0',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import YNAB data" });
    }
  });

  app.post("/api/import/ynab-csv", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { csvContent, accountName, fileName } = req.body;
      
      if (!csvContent || !accountName) {
        return res.status(400).json({ message: "CSV content and account name are required" });
      }
      
      const rows = ynab.parseYNABCSV(csvContent);
      
      const existingAccounts = await storage.getAccounts(userId);
      let account = existingAccounts.find(a => a.name === accountName);
      
      let accountsImported = 0;
      if (!account) {
        account = await storage.createAccount({
          userId,
          name: accountName,
          type: 'checking',
          balance: '0',
        });
        accountsImported = 1;
      }
      
      let transactionsImported = 0;
      for (const row of rows) {
        const txnData = ynab.mapYNABCSVRowToLocal(row, account.id, userId);
        await storage.createTransaction(txnData);
        transactionsImported++;
      }
      
      await storage.createImportLog({
        userId,
        source: 'ynab_csv',
        fileName: fileName || 'ynab-import.csv',
        accountsImported: accountsImported.toString(),
        transactionsImported: transactionsImported.toString(),
        categoriesImported: '0',
        status: 'success',
      });
      
      res.json({
        success: true,
        accountsImported,
        transactionsImported,
      });
    } catch (error) {
      console.error("Error importing YNAB CSV:", error);
      
      const userId = req.user.claims.sub;
      await storage.createImportLog({
        userId,
        source: 'ynab_csv',
        fileName: req.body.fileName || 'ynab-import.csv',
        accountsImported: '0',
        transactionsImported: '0',
        categoriesImported: '0',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import YNAB CSV" });
    }
  });

  // Import logs endpoint
  app.get("/api/import/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getImportLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching import logs:", error);
      res.status(500).json({ message: "Failed to fetch import logs" });
    }
  });

  // Actual Budget import route
  app.post("/api/import/actual-budget", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { budgetData, fileName } = req.body;
      
      if (!budgetData) {
        return res.status(400).json({ message: "Budget data is required" });
      }
      
      const data = actualbudget.parseActualBudgetJSON(budgetData);
      
      let accountsImported = 0;
      let transactionsImported = 0;
      let categoriesImported = 0;
      
      const accountIdMap = new Map<string, string>();
      
      if (data.accounts) {
        for (const actualAccount of data.accounts) {
          if (actualAccount.closed) continue;
          
          const accountData = actualbudget.mapActualAccountToLocal(actualAccount);
          const localAccount = await storage.createAccount({
            ...accountData,
            userId,
          });
          accountsImported++;
          accountIdMap.set(actualAccount.id, localAccount.id);
        }
      }
      
      if (data.categories) {
        for (const actualCategory of data.categories) {
          if (actualCategory.hidden) continue;
          
          const categoryData = actualbudget.mapActualCategoryToLocal(actualCategory, userId);
          await storage.createCategory({
            ...categoryData,
            sortOrder: '0',
          });
          categoriesImported++;
        }
      }
      
      if (data.transactions) {
        for (const actualTxn of data.transactions) {
          const localAccountId = accountIdMap.get(actualTxn.account);
          if (!localAccountId) continue;
          
          const txnData = actualbudget.mapActualTransactionToLocal(actualTxn, localAccountId, userId);
          await storage.createTransaction(txnData);
          transactionsImported++;
        }
      }
      
      await storage.createImportLog({
        userId,
        source: 'actual_budget',
        fileName: fileName || 'actual-budget-import.json',
        accountsImported: accountsImported.toString(),
        transactionsImported: transactionsImported.toString(),
        categoriesImported: categoriesImported.toString(),
        status: 'success',
      });
      
      res.json({
        success: true,
        accountsImported,
        transactionsImported,
        categoriesImported,
      });
    } catch (error) {
      console.error("Error importing Actual Budget:", error);
      
      const userId = req.user.claims.sub;
      await storage.createImportLog({
        userId,
        source: 'actual_budget',
        fileName: req.body.fileName || 'actual-budget-import.json',
        accountsImported: '0',
        transactionsImported: '0',
        categoriesImported: '0',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import Actual Budget data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
