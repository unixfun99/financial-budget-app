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
} from "@shared/schema";
import { z } from "zod";

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
      const updates = {
        ...validated,
        ...(validated.date && { date: typeof validated.date === 'string' ? new Date(validated.date) : validated.date }),
      };
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

  const httpServer = createServer(app);
  return httpServer;
}
