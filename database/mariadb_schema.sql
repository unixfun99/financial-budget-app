-- ============================================================
-- Financial Budgeting Application - MariaDB Schema
-- ============================================================
-- 
-- This SQL file creates all necessary tables for the Financial
-- Budgeting Application on MariaDB/MySQL.
--
-- Usage:
--   mysql -u root -p < mariadb_schema.sql
--
-- Or if you want to specify a database:
--   mysql -u root -p budget_app < mariadb_schema.sql
--
-- ============================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS budget_app 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE budget_app;

-- ============================================================
-- Session Storage (for Express sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire DATETIME NOT NULL,
  INDEX IDX_session_expire (expire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(255),
  is_financial_planner BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_id VARCHAR(36),
  stripe_customer_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Financial Accounts (checking, savings, credit, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('checking', 'savings', 'credit', 'investment', 'other') NOT NULL,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  connection_type VARCHAR(50) DEFAULT 'none',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_accounts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Budget Categories (envelope-style budgeting)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_category_id VARCHAR(36),
  budgeted DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  sort_order DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_category_id) 
    REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_categories_user (user_id),
  INDEX idx_categories_parent (parent_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36),
  date DATETIME NOT NULL,
  payee VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  is_transfer BOOLEAN NOT NULL DEFAULT FALSE,
  transfer_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) 
    REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) 
    REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_transactions_user (user_id),
  INDEX idx_transactions_account (account_id),
  INDEX idx_transactions_category (category_id),
  INDEX idx_transactions_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Budget Shares (for financial planner access)
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_shares (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  shared_with_user_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_budget_shares_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_shares_shared_with FOREIGN KEY (shared_with_user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_budget_shares_user (user_id),
  INDEX idx_budget_shares_shared_with (shared_with_user_id),
  UNIQUE KEY unique_share (user_id, shared_with_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SimpleFIN Bank Connections
-- ============================================================
CREATE TABLE IF NOT EXISTS simplefin_connections (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  access_url TEXT NOT NULL,
  connection_name VARCHAR(255),
  last_sync DATETIME,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_simplefin_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_simplefin_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Import Logs (track imports from YNAB, Actual Budget, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS import_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  source ENUM('ynab_json', 'ynab_csv', 'actual_budget', 'simplefin', 'csv') NOT NULL,
  file_name VARCHAR(255),
  accounts_imported INT NOT NULL DEFAULT 0,
  transactions_imported INT NOT NULL DEFAULT 0,
  categories_imported INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_import_logs_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_import_logs_user (user_id),
  INDEX idx_import_logs_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Subscriptions (Stripe subscription tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subscriptions_user (user_id),
  INDEX idx_subscriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Coupons (discount codes for subscriptions)
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  plan VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(8, 2) NOT NULL,
  duration_months INT NOT NULL,
  max_uses INT,
  current_uses INT NOT NULL DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Sample Coupon Codes (Optional - Remove in production)
-- ============================================================
-- INSERT INTO coupons (code, plan, discount_type, discount_value, duration_months, max_uses) VALUES
-- ('WELCOME50', 'user', 'percent', 50.00, 3, 100),
-- ('PLANNER20', 'planner', 'percent', 20.00, 6, 50),
-- ('FREEMONTH', 'user', 'percent', 100.00, 1, 200);

-- ============================================================
-- Verify Tables Created
-- ============================================================
SELECT 
  'Tables created successfully!' AS status,
  COUNT(*) AS table_count 
FROM information_schema.tables 
WHERE table_schema = 'budget_app';

-- Show all tables
SHOW TABLES;
