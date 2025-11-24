# Financial Budgeting Application

## Overview
A web-based financial budgeting application inspired by ActualBudget.com with envelope-style budgeting, bank syncing via SimpleFIN, and import support from YNAB and Actual Budget.

**Key Features:**
- Google authentication via Replit Auth
- Envelope-style budgeting (inspired by ActualBudget.com)
- Account management with transaction tracking
- SimpleFIN bank syncing ($1.50/month service)
- Import from YNAB (JSON and CSV formats)
- Import from Actual Budget (JSON format)
- CSV transaction import
- Admin/financial planner interface for budget sharing
- Transfer management between accounts

**Technology Stack:**
- Frontend: React, Wouter (routing), TanStack Query, Shadcn UI, Tailwind CSS
- Backend: Express, PostgreSQL (via Drizzle ORM)
- Authentication: Replit Auth (Google login)
- Fonts: Inter (UI), JetBrains Mono (financial figures)

## Project Architecture

### Database Schema
Main tables defined in `shared/schema.ts`:
- `users` - User accounts with Google authentication
- `accounts` - Financial accounts (checking, savings, credit cards, etc.)
- `categories` - Budget categories with envelope-style tracking
- `transactions` - Financial transactions with category assignments
- `simplefinConnections` - SimpleFIN bank connection metadata
- `importLogs` - Track all import operations (SimpleFIN, YNAB, Actual Budget)

### Data Model Principles
- Keep schemas simple - avoid unnecessary timestamps unless required
- Use Drizzle Zod schemas for type safety
- Insert schemas exclude auto-generated fields
- Select types inferred from table schemas

### Storage Pattern
- In-memory storage (MemStorage) preferred unless database required
- Storage interface (`IStorage` in `server/storage.ts`) defines all CRUD operations
- Storage layer uses types from `@shared/schema.ts`

### Backend Architecture
- API routes in `server/routes.ts` (thin layer)
- All CRUD operations through storage interface
- Request body validation using Zod schemas from `drizzle-zod`
- SimpleFIN integration in `server/simplefin.ts`
- YNAB import in `server/ynab.ts`
- Actual Budget import in `server/actualbudget.ts`
- Encryption utilities in `server/crypto.ts`

### Frontend Architecture
- Routing: Wouter (pages in `client/src/pages/`, registered in `client/src/App.tsx`)
- Forms: Shadcn `useForm` + `Form` component (wraps react-hook-form)
- Form validation: `zodResolver` from `@hookform/resolvers/zod`
- Data fetching: `@tanstack/react-query` with typed queries
- Mutations: Use `apiRequest` from `@lib/queryClient` for POST/PATCH/DELETE
- Cache invalidation: Always invalidate queryKey after mutations
- Loading states: Show loading/skeleton during `.isLoading` (queries) and `.isPending` (mutations)

## SimpleFIN Bank Syncing

### Overview
SimpleFIN provides secure bank account syncing for $1.50/month. The integration supports:
- Automatic account discovery
- Transaction syncing (last 60 days by default)
- Balance updates
- Secure credential storage with AES-256-GCM encryption

### Security Implementation
- **Access URLs:** Encrypted using AES-256-GCM with `ENCRYPTION_KEY` environment variable
- **Claim URL Validation:** Multi-layer validation to prevent SSRF attacks:
  - Protocol: Must be HTTPS only
  - Host allowlist: Only `bridge.simplefin.org` and `beta-bridge.simplefin.org`
  - Exact hostname matching: Validates hostname structure to prevent subdomain bypass (e.g., rejects `bridge.simplefin.org.evil.com`)
  - Path validation: Must contain `/simplefin` in the path
- **SSRF Protection:** Defense-in-depth approach prevents Server-Side Request Forgery attacks through:
  - URL parsing validation
  - Hostname part count verification (prevents extra subdomains)
  - Exact string matching of allowed hosts

### Setup Process
1. User visits https://bridge.simplefin.org
2. User creates SimpleFIN account and links their bank ($1.50/month)
3. User receives a setup token (claim URL)
4. User pastes setup token in the Import & Sync page
5. Application validates claim URL (HTTPS + approved host)
6. Application claims the access URL from SimpleFIN
7. Access URL is encrypted and stored in database
8. User can now sync transactions

### Sync Workflow
1. User clicks "Sync" button on connected bank
2. Confirmation dialog appears
3. Application decrypts access URL
4. Application fetches accounts and transactions from SimpleFIN
5. Accounts are created/updated in database
6. Transactions are imported (deduplicated by SimpleFIN transaction ID)
7. Import log is created with results
8. Cache is invalidated for accounts, transactions, connections, and import logs

### API Endpoints
- `POST /api/simplefin/setup` - Setup a new SimpleFIN connection
- `POST /api/simplefin/sync/:connectionId` - Sync a SimpleFIN connection
- `GET /api/simplefin/connections` - Get all SimpleFIN connections
- `DELETE /api/simplefin/connections/:id` - Remove a SimpleFIN connection

### Best Practices
- Always sync regularly to keep transactions up to date
- SimpleFIN syncs last 60 days by default
- Existing transactions are not deleted when connection is removed
- Connection metadata (encrypted access URL) is deleted when connection is removed
- Use confirmation dialogs for destructive actions

## YNAB Import

### Supported Formats

**JSON Format (API Export):**
```json
{
  "budgets": [{
    "accounts": [{"id": "...", "name": "Checking"}],
    "categories": [{"id": "...", "name": "Groceries"}],
    "transactions": [{"date": "2024-01-15", "amount": -50000, "payee_name": "Store"}]
  }]
}
```

**CSV Format:**
```csv
Date,Payee,Memo,Amount
2024-01-15,Store,Groceries,-50.00
```

### Import Process
1. User selects format (JSON or CSV)
2. User pastes content into textarea
3. For CSV: User specifies account name
4. Application validates JSON structure or CSV format
5. Data is parsed and imported
6. Import log is created
7. Cache is invalidated

### API Endpoints
- `POST /api/import/ynab-json` - Import YNAB JSON data
- `POST /api/import/ynab-csv` - Import YNAB CSV data

## Actual Budget Import

### Format
Actual Budget uses JSON export format:
```json
{
  "accounts": [{"id": "...", "name": "Checking"}],
  "categories": [{"id": "...", "name": "Groceries"}],
  "transactions": [{"date": "2024-01-15", "amount": -5000, "payee": "Store"}]
}
```

### Import Process
1. User pastes Actual Budget JSON into textarea
2. Application validates JSON structure
3. Data is parsed and imported
4. Import log is created
5. Cache is invalidated

### API Endpoints
- `POST /api/import/actual-budget` - Import Actual Budget data

## Import History

All import operations are logged in the `importLogs` table with:
- Source (simplefin, ynab, actual_budget)
- File name
- Status (success/failure)
- Counts (accounts, transactions, categories imported)
- Error messages (if failed)
- Timestamp

### API Endpoints
- `GET /api/import/logs` - Get all import logs

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `ENCRYPTION_KEY` - 32-byte hex string for AES-256-GCM encryption

## Development Workflow

### Running the Project
```bash
npm run dev
```
This starts:
- Express server for backend
- Vite server for frontend
- Both served on same port (5000)

### Database Management
```bash
npm run db:push        # Sync schema to database
npm run db:push --force # Force sync (use when standard push fails)
npm run db:studio      # Open Drizzle Studio
```

### Installing Packages
Use the packager tool - NEVER edit package.json directly

### Code Style
- Follow existing patterns in codebase
- Use existing libraries and utilities
- Mimic code style of neighboring files
- Check imports to understand framework choices
- Always use `data-testid` attributes for interactive elements

## Future Plans
- Automated sync scheduling for SimpleFIN accounts
- Budget sharing between users
- Financial planner admin interface
- MySQL deployment support on Rocky Linux

## Recent Changes

### November 24, 2025
- Fixed 8 critical UI interaction issues identified in testing:
  1. Budget category expansion: Categories properly expand/collapse showing subcategories
  2. Add Account button: Properly integrated with AccountForm modal
  3. Transaction editing: Form pre-fills correctly for TransactionsView mock data (with setTimeout race condition fix)
  4. Reports dropdown: State management working correctly
  5. Admin Dashboard view: Shows visible feedback card when client selected
  6. Profile save: Honest "not persisted" toast messages
  7. Sharing functionality: Working UI with clear TODO comments for backend integration
  8. Notification preferences: All switches have proper state management

**Known Limitations:**
- Transaction editing on Dashboard uses backend data (categoryId/accountId UUIDs) which doesn't map to TransactionForm's display-name-based selects. TransactionsView mock data editing works correctly.
- Budget subcategory updates have TODO comments but don't persist (requires backend API and nested state updates)
- Settings changes (profile, password, sharing, notifications) show "not persisted" toasts pending backend integration
- Admin Dashboard client view shows placeholder card with TODO for full budget view implementation

**Transaction Form Data Flow:**
- TransactionsView: Uses mock data with display names ("Groceries", "Checking") - editing works
- Dashboard: Uses backend data with UUIDs (categoryId, accountId) - editing shows empty selects
- Future fix: Align form to use IDs consistently or fetch category/account options from backend

### November 18, 2025
- Completed SimpleFIN backend with security hardening
- Fixed SSRF vulnerability in claim URL validation
- Added YNAB and Actual Budget import backends
- Created Import & Sync page with all import/sync features
- Added confirmation dialogs for dangerous actions
- Implemented proper cache invalidation
- Added import history tracking
- Form validation for setup tokens
- Helpful instructions and guidance for users
