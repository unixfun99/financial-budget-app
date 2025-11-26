# Financial Budgeting Application

## Overview
A web-based financial budgeting application inspired by ActualBudget.com with envelope-style budgeting, bank syncing via SimpleFIN, and import support from YNAB and Actual Budget. Free access with Google login only - all pricing/subscription features removed.

**Key Features:**
- Google authentication via Replit Auth (dev) / OAuth (production)
- Envelope-style budgeting with budget categories and subcategories
- Account management with transaction tracking
- SimpleFIN bank syncing ($1.50/month service)
- Import from YNAB (JSON and CSV formats)
- Import from Actual Budget (JSON format)
- CSV transaction import
- Admin/financial planner interface for budget sharing
- Transfer management between accounts

**Technology Stack:**
- Frontend: React, Wouter (routing), TanStack Query, Shadcn UI, Tailwind CSS
- Backend: Express, PostgreSQL (Replit dev) or MariaDB (production, Rocky Linux)
- Authentication: Replit Auth (Google login via Replit)
- Fonts: Inter (UI), JetBrains Mono (financial figures)

## Project Architecture

### Database Schema
Main tables defined in `shared/schema.ts` (PostgreSQL) and `shared/schema.mariadb.ts` (MariaDB):
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
- Dual schema support: PostgreSQL for dev, MariaDB for production

### Storage Pattern
- Dual storage adapter architecture for cross-database compatibility
- `server/storage.ts` - PostgreSQL adapter for Replit (uses `.returning()`, `onConflictDoUpdate`)
- `server/storage.mysql.ts` - MySQL/MariaDB adapter for production (uses `onDuplicateKeyUpdate`, SELECT-after-INSERT)
- Storage interface (`IStorage` in `server/storage.ts`) defines all CRUD operations
- Dynamically loads correct adapter based on `REPL_ID` environment variable
- PostgreSQL storage uses types from `@shared/schema.ts`
- MySQL storage uses types from `@shared/schema.mariadb.ts`

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
  - Exact hostname matching: Validates hostname structure to prevent subdomain bypass
  - Path validation: Must contain `/simplefin` in the path
- **SSRF Protection:** Defense-in-depth approach prevents Server-Side Request Forgery attacks

### API Endpoints
- `POST /api/simplefin/setup` - Setup a new SimpleFIN connection
- `POST /api/simplefin/sync/:connectionId` - Sync a SimpleFIN connection
- `GET /api/simplefin/connections` - Get all SimpleFIN connections
- `DELETE /api/simplefin/connections/:id` - Remove a SimpleFIN connection

## YNAB and Actual Budget Import

### Supported Formats

**YNAB JSON and CSV**: Import transaction and category data
**Actual Budget JSON**: Full budget exports with accounts and categories

### Import API Endpoints
- `POST /api/import/ynab-json` - Import YNAB JSON data
- `POST /api/import/ynab-csv` - Import YNAB CSV data
- `POST /api/import/actual-budget` - Import Actual Budget data
- `GET /api/import/logs` - Get all import logs

## Environment Variables

### Development (Replit)
- `DATABASE_URL` - PostgreSQL via Neon
- `SESSION_SECRET` - Express session secret
- `ENCRYPTION_KEY` - 64-character hex string for AES-256-GCM

### Production (Rocky Linux)
- `DATABASE_URL` - MariaDB connection: `mysql2://user:pass@host:3306/database`
- `SESSION_SECRET` - Production-grade secret
- `ENCRYPTION_KEY` - Production encryption key
- `NODE_ENV` - Must be set to `production`
- `MYSQL_SSL_CA` - **Required** Path to CA certificate for MySQL TLS verification
- `MYSQL_SSL_VERIFY` - Set to `false` to temporarily disable SSL verification (debugging only)
- `APP_URL` - Full URL of the application (e.g., `https://budget.example.com`)

## Development Workflow

### Running the Project
```bash
npm run dev
```
This starts:
- Express server for backend (port 5000)
- Vite server for frontend (served via Express)
- Both served on same port with hot reload

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

## Deployment Configurations

### Development (Replit)
- PostgreSQL database (Neon serverless)
- Replit Auth for authentication
- In-memory session storage
- localhost:5000

### Production (Rocky Linux)
- MariaDB database
- Apache reverse proxy (HTTP/HTTPS)
- OAuth2 for authentication
- SSL/TLS with Let's Encrypt
- Systemd service for auto-restart

### Production (Docker)
- Docker Compose with MariaDB
- Nginx reverse proxy
- Multi-stage Docker builds
- Health checks configured

## Deployment Instructions

1. **Rocky Linux Deployment**: See `DEPLOYMENT_ROCKY_LINUX.md`
2. **Docker Deployment**: See `DEPLOYMENT_DOCKER.md`
3. **GitHub Setup**: See `GITHUB_DEPLOYMENT.md`

## Recent Changes

### November 25, 2025 (Latest - Deployment Refactor)
- **MariaDB Schema**: Created `shared/schema.mariadb.ts` for Rocky Linux deployment
  - UUID() instead of gen_random_uuid()
  - datetime instead of timestamp
  - JSON instead of JSONB
  - Native MySQL enums
- **Drizzle Config**: Added `drizzle.config.mariadb.ts` for production migrations
- **Apache Configuration**: Created `apache-budget-app.conf` template with:
  - SSL/TLS setup with Let's Encrypt
  - Security headers (HSTS, X-Frame-Options, CSP)
  - Reverse proxy to Node.js
  - WebSocket support
  - Gzip compression
- **Rocky Linux Guide**: Comprehensive `DEPLOYMENT_ROCKY_LINUX.md` with:
  - System setup and package installation
  - MariaDB configuration
  - Node.js installation
  - Apache/SSL setup
  - Systemd service configuration
  - Backup and recovery procedures
- **GitHub Setup**: Created `GITHUB_DEPLOYMENT.md` with:
  - Repository initialization
  - GitHub Actions workflows (build, deploy, test)
  - Secrets management
  - Release versioning
- **Docker Support**: Created `DEPLOYMENT_DOCKER.md` with:
  - Multi-stage Dockerfile
  - Docker Compose configurations (dev and prod)
  - Nginx configuration for production
  - SSL certificate setup
  - Database backup/restore scripts
- **Documentation**: Created `README.md` and `ARCHITECTURE.md`
  - Feature overview and tech stack
  - System architecture and component design
  - Data flow patterns
  - Deployment architecture
  - Security architecture
- **Project Structure**: Updated `replit.md` with deployment information

### November 24, 2025 (Stripe & Pricing Release)
- Stripe payment integration completed
- Pricing page and signup flow
- Coupon/discount code system
- Subscription tier management

### November 24, 2025 (Bug Fixes)
- Fixed 8 critical UI interaction issues
- Fixed category expansion and subcategory updates
- Fixed transaction form pre-fill logic
- Fixed reports dropdown time period filtering

## Known Limitations

- **Transaction Form Data Alignment**: Dashboard uses backend UUID data, TransactionsView uses display names. TransactionsView editing works; Dashboard editing shows empty selects.
- **Budget Subcategory Updates**: UI works but doesn't persist (requires backend API)
- **Settings Changes**: Show "not persisted" toasts - pending backend integration
- **Admin Dashboard**: Placeholder client view card - full budget view pending

## Future Plans

1. **Mobile App**: React Native implementation
2. **Automated Sync**: Schedule SimpleFIN/Plaid syncs
3. **Budget Sharing**: Multi-user collaborative budgets
4. **Advanced Reports**: Dashboard with analytics
5. **Budget Templates**: Pre-built category templates
6. **Financial Goals**: Savings goals tracking
7. **API Keys**: Public API for integrations
8. **Expense Rules**: Automatic categorization rules

## Database Compatibility

### PostgreSQL (Development)
- Native UUID generation: `gen_random_uuid()`
- JSONB for complex data
- Enum types
- Used with Replit Neon database

### MariaDB (Production)
- UUID() function
- JSON for data (not JSONB)
- Native MySQL enums
- Used on Rocky Linux with Apache

## Testing

- All routes validated with proper request/response
- Form validation via Zod schemas
- Database operations through storage interface
- Stripe webhook signature verification
- SimpleFIN SSRF protection tested

## Security Considerations

- SSRF protection for external URLs (SimpleFIN claims)
- AES-256-GCM encryption for stored credentials
- SQL injection prevention via Drizzle ORM
- CSRF protection ready
- Stripe webhook signature verification
- Rate limiting ready for deployment
- User isolation via userId in all queries

## Performance Notes

- Frontend bundle: 854KB (gzip 242KB)
- Database indexes on common queries
- Session storage configurable (MemStore for dev, database for prod)
- Query optimization via Drizzle ORM
- Caching via TanStack Query
