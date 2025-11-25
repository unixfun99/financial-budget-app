# Architecture Documentation

## System Overview

The Financial Budgeting Application is a full-stack web application built with modern JavaScript technologies, designed to provide a secure, scalable budgeting platform with bank syncing and subscription management.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React + TypeScript)              │
│  - Pages: Dashboard, Budget, Accounts, Transactions, Reports│
│  - Components: Forms, Cards, Tables, Charts (Recharts)      │
│  - State Management: TanStack Query for server state         │
│  - Styling: TailwindCSS + Shadcn UI components             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js Backend API                      │
│  - RESTful endpoints for all CRUD operations               │
│  - Authentication middleware                               │
│  - Request validation with Zod                             │
│  - Stripe webhook handling                                 │
│  - Bank sync orchestration                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
  ┌────────┐   ┌──────────┐   ┌──────────┐
  │Database│   │Stripe    │   │SimpleFIN │
  │(PG/MB) │   │  API     │   │  API     │
  └────────┘   └──────────┘   └──────────┘
```

## Component Architecture

### Frontend Layer

#### Pages
- **Dashboard**: User home page with overview and recent transactions
- **Budget**: Category budgeting and envelope tracking
- **Accounts**: Account management and balances
- **Transactions**: Transaction list, search, and editing
- **Reports**: Financial analytics and reports
- **Admin**: Financial planner client management
- **Settings**: User profile and preferences
- **Import/Sync**: Bank syncing and data import
- **Pricing**: Public pricing page
- **Signup**: Subscription signup flow

#### Components
- **Forms**: AccountForm, CategoryForm, TransactionForm (controlled forms with validation)
- **UI**: Buttons, Cards, Dialogs, Selects, etc. (Shadcn UI)
- **Charts**: Spending visualizations (Recharts)
- **Navigation**: Sidebar with wouter routing

#### State Management
- **TanStack Query v5**: 
  - Queries for GET requests (caching, refetching)
  - Mutations for POST/PATCH/DELETE operations
  - Automatic cache invalidation
  - Query keys: `['/api/endpoint', id]` for hierarchical keys

#### Hooks
- `useAuth()`: Authentication state and user info
- `useToast()`: Toast notifications
- `useForm()`: Form state and validation (react-hook-form)

### Backend Layer

#### Entry Point: `server/index.ts`
- Initializes Express app
- Registers routes
- Sets up Vite dev server
- Handles errors

#### Routes: `server/routes.ts`
Thin routing layer that:
- Validates request body with Zod schemas
- Calls storage methods
- Returns JSON responses
- Handles errors

#### Storage: `server/storage.ts`
Interface defining all CRUD operations:
```typescript
interface IStorage {
  // Users
  getUser(id: string): Promise<User | null>
  upsertUser(user: UpsertUser): Promise<User>
  
  // Accounts
  getAccounts(userId: string): Promise<Account[]>
  createAccount(account: InsertAccount): Promise<Account>
  // ... more methods
}
```

Storage implementations:
- `MemStorage`: In-memory storage (development)
- Database-backed storage (production)

#### Database: `shared/schema.ts`
Drizzle ORM schema definitions:
- **Tables**: users, accounts, categories, transactions, budgetShares, simplefinConnections, importLogs, subscriptions, coupons
- **Enums**: accountType, importSource
- **Relations**: Foreign keys and relationships
- **Types**: TypeScript interfaces generated from schema
- **Zod Schemas**: Validation schemas for each table

#### Authentication: `server/auth.ts`
- Replit Auth integration (development)
- Session management with express-session
- User middleware for route protection

#### Payments: `server/stripeClient.ts`
- Stripe API client initialization
- Webhook endpoint setup
- Payment processing

#### Stripe Service: `server/stripeService.ts`
Business logic for:
- Creating checkout sessions
- Managing subscriptions
- Applying coupon codes
- Processing upgrades/downgrades

#### Webhook Handlers: `server/webhookHandlers.ts`
Stripe event handlers:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

#### Bank Syncing: `server/simplefin.ts`
SimpleFIN integration:
- Setup claim URLs (SSRF protected)
- Fetch accounts and transactions
- Deduplicate transactions
- Update balances

#### Imports: `server/ynab.ts`, `server/actualbudget.ts`
- Parse YNAB JSON/CSV formats
- Parse Actual Budget JSON
- Map external data to internal schema
- Import with conflict resolution

#### Security: `server/crypto.ts`
- AES-256-GCM encryption/decryption
- Secure credential storage
- IV generation and validation

#### Development Server: `server/vite.ts`
- Vite hot module reloading
- Static file serving
- API proxying

### Database Layer

#### PostgreSQL (Development)
- Connection via Neon (serverless)
- Schema in `shared/schema.ts`
- Migrations in `migrations/` directory

#### MariaDB (Production)
- Connection via TCP/IP
- Schema in `shared/schema.mariadb.ts`
- Migrations in `migrations/mariadb/` directory

#### Key Tables

**users**
- id (UUID)
- email (unique)
- firstName, lastName
- isFinancialPlanner (boolean)
- subscriptionId (FK)
- stripeCustomerId
- createdAt, updatedAt

**accounts**
- id (UUID)
- userId (FK)
- name
- type (enum: checking, savings, credit, investment, other)
- balance (decimal)
- connectionType (none, simplefin, plaid)
- createdAt, updatedAt

**categories**
- id (UUID)
- userId (FK)
- name
- parentCategoryId (FK, self-referential for subcategories)
- budgeted (decimal)
- sortOrder (decimal)
- createdAt, updatedAt

**transactions**
- id (UUID)
- userId (FK)
- accountId (FK)
- categoryId (FK, nullable)
- date
- payee
- amount (decimal)
- notes
- isTransfer (boolean)
- transferId (UUID, optional)
- createdAt, updatedAt

**subscriptions**
- id (UUID)
- userId (FK)
- stripeSubscriptionId (unique)
- plan (free, user, planner)
- status (active, canceled, expired)
- currentPeriodEnd
- createdAt, updatedAt

**coupons**
- id (UUID)
- code (unique)
- plan (user, planner)
- discountType (percent, fixed)
- discountValue (decimal)
- durationMonths (integer)
- maxUses (integer, nullable = unlimited)
- currentUses (integer)
- expiresAt (nullable)
- createdAt

**importLogs**
- Tracks all import operations
- Source, fileName, counts, status, errors

## Data Flow Patterns

### CRUD Operations

1. **Create**
   ```
   Client → POST /api/resource → Validate (Zod) → Storage.create() → Database → Response
   ```

2. **Read**
   ```
   Client (Query) → GET /api/resource/:id → Storage.get() → Database → Response (cached)
   ```

3. **Update**
   ```
   Client → PATCH /api/resource/:id → Validate (Zod) → Storage.update() → Database → Invalidate cache → Response
   ```

4. **Delete**
   ```
   Client → DELETE /api/resource/:id → Storage.delete() → Database → Invalidate cache → Response
   ```

### Bank Syncing Flow

1. User submits SimpleFIN claim URL
2. Backend validates URL (HTTPS, allowlist hosts, no SSRF)
3. Backend exchanges claim for access URL
4. Access URL encrypted and stored
5. User clicks "Sync"
6. Backend decrypts and fetches from SimpleFIN API
7. Accounts and transactions created/updated
8. Import log created
9. Cache invalidated for UI refresh

### Payment Flow

1. User selects plan on pricing page
2. Redirected to checkout
3. Stripe checkout session created
4. User completes payment
5. Stripe webhook sent to backend
6. Subscription created in database
7. User redirected to dashboard

## Key Design Decisions

### 1. Thin Backend Layer
- Business logic kept minimal
- Storage interface abstracts data source
- Routes focus on HTTP concerns

### 2. Type Safety
- TypeScript throughout
- Zod validation for runtime safety
- Schema-driven development

### 3. Drizzle ORM
- Type-safe SQL queries
- Automatic relationship loading
- Migration-first approach
- Works with both PostgreSQL and MySQL

### 4. TanStack Query
- Automatic caching and refetching
- Optimistic updates possible
- Reduces API calls
- Built-in loading/error states

### 5. Component-Based UI
- Reusable Shadcn UI components
- Controlled form components
- Atomic design patterns

### 6. Security-First
- Encryption for sensitive data
- SSRF protection
- Webhook signature verification
- SQL injection prevention

### 7. Scalability
- Horizontal scaling ready (stateless backend)
- Database can be scaled independently
- API rate limiting ready
- Async job queue ready (background tasks)

## Integration Points

### Stripe
- Payment processing
- Subscription management
- Webhook notifications
- Coupon validation

### SimpleFIN
- Bank account discovery
- Transaction fetching
- Balance synchronization
- Secure credential exchange

### External Import Sources
- YNAB (JSON and CSV)
- Actual Budget (JSON)
- Generic CSV

## Error Handling

### Frontend
- Toast notifications for errors
- Form validation feedback
- Loading states
- Error boundaries (ready to add)

### Backend
- Centralized error handler middleware
- Validation error messages
- Database error handling
- API error responses

### Database
- Transaction support
- Foreign key constraints
- Cascade delete rules
- Index optimization

## Performance Considerations

### Frontend
- Code splitting with dynamic imports
- Image optimization
- Bundle size monitoring (854KB gzip)
- Lazy loading routes

### Backend
- Database indexing on common queries
- Query optimization with Drizzle
- Caching layer ready
- Connection pooling

### Database
- Indexes on foreign keys
- Composite indexes for common filters
- Query explain plans analyzed

## Deployment Architecture

### Development
```
Replit VM → Node.js + Vite → PostgreSQL (Neon)
       ↓ (HTTP)
    Browser
```

### Production (Rocky Linux)
```
Apache (port 80/443)
    ↓ (reverse proxy)
Node.js App (port 5000)
    ↓
MariaDB (port 3306)
    ↓
Stripe/SimpleFIN APIs
```

## Future Scalability

### Horizontal Scaling
- Stateless backend (ready for load balancing)
- Session store migration to Redis
- Rate limiting per IP/user
- Job queue for async tasks (background imports, syncing)

### Database Scaling
- Read replicas for reporting
- Sharding by userId (if needed)
- Archive old transactions
- Data warehouse integration

### Infrastructure
- Containerization (Docker)
- Kubernetes deployment (K8s manifests)
- CDN for static assets
- Multi-region deployment

## Testing Strategy

### Unit Tests
- Storage interface implementations
- Utility functions
- Validation schemas

### Integration Tests
- API endpoint testing
- Database operations
- Stripe mock testing

### E2E Tests
- User flows (signup, login, transactions)
- Payment flows
- Bank syncing flows

## Monitoring and Observability

### Logs
- Structured logging (JSON)
- Different log levels
- Request tracing

### Metrics
- API response times
- Database query performance
- Error rates
- Active users

### Health Checks
- Database connectivity
- External API availability
- Stripe webhook status

## Security Architecture

### Authentication
- OAuth 2.0 (Replit Auth in dev, standard OAuth in prod)
- Session tokens (JWT ready)
- User middleware for route protection

### Authorization
- User isolation (userId in queries)
- Financial planner access control
- Admin endpoints protected

### Data Security
- Encryption at rest (AES-256-GCM for sensitive data)
- Encryption in transit (HTTPS/TLS)
- SQL injection prevention (parameterized queries)
- CSRF protection ready

### API Security
- Rate limiting ready
- CORS configuration
- Webhook signature verification
- Input validation (Zod)

## Compliance

### Data Privacy
- GDPR ready (user data export)
- User deletion (cascade deletes)
- Audit logging for imports
- Encrypted credential storage

### Financial Data
- Encryption of banking credentials
- Secure API communication
- PCI compliance ready (via Stripe)
- Transaction audit trail

---

This architecture is designed to be:
- **Scalable**: Handle growth easily
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple layers of protection
- **Testable**: Modular and decoupled
- **Flexible**: Easy to add features
