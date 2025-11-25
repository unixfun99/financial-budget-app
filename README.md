# Financial Budgeting Application

A full-featured web-based financial budgeting application with envelope-style budgeting, bank syncing via SimpleFIN and Plaid, transaction tracking, and subscription-based pricing.

## 🎯 Features

- **🔐 Google Authentication**: Secure login via Replit Auth (development) or OAuth (production)
- **💰 Envelope-Style Budgeting**: Track spending against category budgets (inspired by YNAB & Actual Budget)
- **🏦 Bank Syncing**: 
  - SimpleFIN integration ($1.50/month per connection)
  - Plaid OAuth support (secure bank connections)
- **📊 Transaction Tracking**: Categorize and track all financial transactions
- **📤 Import Support**: 
  - YNAB JSON and CSV formats
  - Actual Budget JSON exports
  - Generic CSV imports
- **💳 Stripe Payments**: 
  - Personal tier: $1/month for unlimited budget tracking
  - Financial Planner tier: $5/month for client management
  - Coupon/discount code system
- **👥 Budget Sharing**: Share budgets with financial planners
- **📈 Reports & Analytics**: Visualize spending patterns
- **🌙 Dark Mode**: Full dark/light mode support
- **♻️ Transfer Management**: Move money between accounts

## 💻 Tech Stack

### Frontend
- React 18+ with TypeScript
- TailwindCSS + Shadcn UI components
- Wouter for client-side routing
- TanStack React Query for data fetching
- Stripe.js for payments
- Date-fns for date manipulation

### Backend
- Express.js + Node.js
- Drizzle ORM for database access
- PostgreSQL (development) / MariaDB (production)
- Stripe API integration
- SimpleFIN & Plaid for bank connections

### Infrastructure
- Replit Auth (development)
- Stripe (payments)
- Apache + Node.js (production)
- Rocky Linux deployment support

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server (Replit or local)
npm run dev

# App runs on http://localhost:5000
```

### Build for Production

```bash
npm run build
npm start
```

## 📋 Prerequisites

### Development
- Node.js 18+ LTS
- npm or yarn
- Git

### Production (Rocky Linux)
- Rocky Linux 8.x or 9.x
- MariaDB 10.5+
- Node.js 18+ LTS
- Apache 2.4+

## ⚙️ Configuration

### Environment Variables

Create `.env` file for development:

```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/budget_app
SESSION_SECRET=random_session_secret_here
ENCRYPTION_KEY=64_character_hex_string_here
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Database Setup

```bash
# Sync schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## 📚 Documentation

- **[DEPLOYMENT_ROCKY_LINUX.md](DEPLOYMENT_ROCKY_LINUX.md)** - Complete Rocky Linux + MariaDB + Apache deployment guide
- **[GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)** - GitHub repository setup and CI/CD workflows
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[API.md](API.md)** - REST API endpoint documentation

## 🏗️ Project Structure

```
financial-budget-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles/           # Global styles
│   └── index.html
├── server/                    # Express backend
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── storage.ts            # Data storage interface
│   ├── stripeClient.ts       # Stripe integration
│   ├── stripeService.ts      # Stripe business logic
│   ├── webhookHandlers.ts    # Stripe webhook handlers
│   ├── simplefin.ts          # SimpleFIN bank syncing
│   ├── ynab.ts               # YNAB import logic
│   ├── actualbudget.ts       # Actual Budget import
│   ├── crypto.ts             # Encryption utilities
│   └── vite.ts               # Vite dev server
├── shared/                    # Shared code
│   ├── schema.ts             # PostgreSQL schema (dev)
│   └── schema.mariadb.ts     # MariaDB schema (prod)
├── migrations/               # Database migrations
├── package.json
├── drizzle.config.ts         # Drizzle ORM config (PostgreSQL)
├── drizzle.config.mariadb.ts # Drizzle ORM config (MariaDB)
└── vite.config.ts            # Vite config
```

## 🔐 Security Features

- **SSRF Protection**: Multi-layer validation for external URLs
- **AES-256-GCM Encryption**: Secure credential storage for bank connections
- **Stripe Webhook Signing**: Verified webhook handling
- **Session Management**: Secure session storage with encryption
- **HTTPS/TLS**: Required for production
- **SQL Injection Prevention**: Drizzle ORM parameterized queries

## 💰 Pricing Model

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | Basic budget tracking, manual transactions |
| Personal | $1/month | Full features for personal use |
| Financial Planner | $5/month | Multi-client management, sharing |

Coupon codes available for monthly or yearly discounts.

## 🔄 Data Import/Export

### Supported Import Formats
- **YNAB JSON**: Full YNAB budget exports
- **YNAB CSV**: Simplified transaction imports
- **Actual Budget JSON**: Complete budget data
- **Generic CSV**: Custom transaction data

### Data Persistence
All data stored in database - no reliance on external cloud storage.

## 🛠️ Development Workflow

### Type Checking
```bash
npm run check
```

### Building
```bash
npm run build
```

### Database Migrations
```bash
# Push schema to database
npm run db:push

# Force push (use with caution)
npm run db:push --force

# View database in Drizzle Studio
npm run db:studio
```

## 🚀 Deployment

### For Rocky Linux + MariaDB + Apache

Follow the comprehensive guide in [DEPLOYMENT_ROCKY_LINUX.md](DEPLOYMENT_ROCKY_LINUX.md)

Key steps:
1. Set up Rocky Linux system and install dependencies
2. Configure MariaDB database
3. Clone repository and install npm packages
4. Set environment variables
5. Configure Apache reverse proxy
6. Set up SSL with Let's Encrypt
7. Create systemd service for automatic startup

### For GitHub Deployment

Follow setup in [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)

Includes:
- Repository setup
- GitHub Actions CI/CD workflows
- Automated deployments
- Secrets management

## 📊 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### Accounts
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Subscriptions
- `GET /api/pricing` - Get pricing info
- `POST /api/subscription/validate-coupon` - Validate coupon
- `POST /api/subscription/checkout` - Create checkout session

See [API.md](API.md) for full endpoint documentation.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Or for MariaDB
mysql -u user -p -h host -D database
```

### Build Errors
```bash
# Clear caches and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Commit (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/financial-budget-app/issues)
- Email: support@yourdomain.com
- Documentation: See README and markdown files above

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [TailwindCSS](https://tailwindcss.com)
- [Shadcn UI Components](https://ui.shadcn.com)

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full budgeting features
- Stripe integration
- Bank syncing support
- Multi-tier pricing

## 📢 Roadmap

- [ ] Mobile app (React Native)
- [ ] Automated sync scheduling
- [ ] Advanced reporting dashboards
- [ ] Budget templates
- [ ] Collaborative budgets for couples/families
- [ ] Custom expense rules and automation
- [ ] Financial insights and recommendations

---

**Made with ❤️ for better financial management**
