# GitHub Deployment Instructions

This document explains how to publish and manage the Financial Budgeting Application on your GitHub instance.

## Prerequisites

- GitHub account or GitHub Enterprise instance access
- Git installed locally
- Application repository cloned and working

## Step 1: Create GitHub Repository

### Using Public GitHub

```bash
# Create new repository on github.com
# Name: financial-budget-app
# Description: Full-featured envelope budgeting application with bank syncing and subscriptions
# Visibility: Public/Private (as desired)

# Add remote to local repository
cd /path/to/financial-budget-app
git remote add origin https://github.com/yourusername/financial-budget-app.git

# Create main branch if needed
git checkout -b main

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Financial budgeting application with Stripe integration"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Using GitHub Enterprise (Self-Hosted)

```bash
# Add remote to your GitHub instance
git remote add origin https://github.enterprise.com/yourusername/financial-budget-app.git

# Push to your instance
git push -u origin main
```

## Step 2: Repository Structure

Ensure the following structure in your GitHub repository:

```
financial-budget-app/
├── .gitignore
├── README.md
├── DEPLOYMENT_ROCKY_LINUX.md
├── GITHUB_DEPLOYMENT.md
├── DOCKER_DEPLOYMENT.md
├── apache-budget-app.conf
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── drizzle.config.mariadb.ts
├── shared/
│   ├── schema.ts (PostgreSQL)
│   └── schema.mariadb.ts (MariaDB)
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── stripeClient.ts
│   ├── stripeService.ts
│   ├── webhookHandlers.ts
│   ├── simplefin.ts
│   ├── ynab.ts
│   ├── actualbudget.ts
│   ├── crypto.ts
│   └── vite.ts
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── index.html
├── migrations/
└── .github/
    ├── workflows/
    │   ├── build.yml
    │   ├── deploy.yml
    │   └── test.yml
    └── ISSUE_TEMPLATE/
```

## Step 3: Create .gitignore

Create a `.gitignore` file to exclude sensitive and build files:

```
# Dependencies
node_modules/
dist/
build/

# Environment variables
.env
.env.local
.env.production.local
.env.test.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Build artifacts
public/assets/

# Database
*.db
*.sqlite
migrations/

# Temporary files
tmp/
temp/
```

## Step 4: Create README.md

Create comprehensive README:

```markdown
# Financial Budgeting Application

A full-featured web-based financial budgeting application with envelope-style budgeting, bank syncing, and subscription pricing.

## Features

- 🔐 Google authentication via OAuth
- 💰 Envelope-style budgeting (inspired by YNAB and Actual Budget)
- 🏦 Bank syncing via SimpleFIN and Plaid
- 📊 Transaction tracking and categorization
- 📤 Import from YNAB, Actual Budget, CSV
- 💳 Stripe payment integration
- 👥 Budget sharing with financial planners
- 📈 Advanced reporting and analytics

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (dev) or MariaDB (production)
- **ORM**: Drizzle ORM
- **Payments**: Stripe
- **Authentication**: Replit Auth (dev) or OAuth (production)

## Quick Start

### Development

```bash
npm install
npm run dev
# App runs on http://localhost:5000
```

### Production

See [DEPLOYMENT_ROCKY_LINUX.md](DEPLOYMENT_ROCKY_LINUX.md) for complete deployment instructions.

### Docker

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for containerized deployment.

## Configuration

Create `.env` file:

```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/budget_app
SESSION_SECRET=random_secret_key
ENCRYPTION_KEY=64_character_hex_key
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## API Documentation

See [API.md](API.md) for complete API reference.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/financial-budget-app/issues)
- Email: support@yourdomain.com
```

## Step 5: GitHub Actions Workflows

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Check types
      run: npm run check
    
    - name: Build
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist-${{ matrix.node-version }}
        path: dist/
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to production
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
      run: |
        mkdir -p ~/.ssh
        echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
        chmod 600 ~/.ssh/deploy_key
        ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
        
        # Deploy using SSH
        ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_PATH && git pull && npm install && npm run build && systemctl restart budget-app"
```

## Step 6: Secrets Management

Set up GitHub Secrets for sensitive data:

1. Go to Settings → Secrets and variables → Actions
2. Create these secrets:
   - `DATABASE_URL`: Production database connection
   - `SESSION_SECRET`: Express session secret
   - `ENCRYPTION_KEY`: Encryption key
   - `STRIPE_PUBLIC_KEY`: Stripe public key
   - `STRIPE_SECRET_KEY`: Stripe secret key
   - `DEPLOY_KEY`: SSH private key for deployment
   - `DEPLOY_HOST`: Production server hostname
   - `DEPLOY_USER`: SSH user for deployment
   - `DEPLOY_PATH`: Path to app on server

## Step 7: Releases

Create releases for versioning:

```bash
# Create a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# GitHub will create a Release automatically
# Or create manually in GitHub UI under Releases
```

## Step 8: Documentation

Create additional documentation files:

### API.md
Document all API endpoints with examples

### ARCHITECTURE.md
Explain system architecture and design decisions

### CONTRIBUTING.md
Guidelines for contributors

### SECURITY.md
Security practices and vulnerability reporting

### TROUBLESHOOTING.md
Common issues and solutions

## Step 9: License

Choose and add a license (MIT recommended):

```bash
# Download MIT license
curl https://opensource.org/licenses/MIT -o LICENSE
```

## Step 10: Push to GitHub

```bash
# Add all documentation
git add .

# Commit
git commit -m "Add deployment and GitHub documentation"

# Push to GitHub
git push origin main

# Create first release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

## Continuous Updates

### Keeping Your Fork Updated

If using a fork from another repository:

```bash
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git rebase upstream/main
git push origin main
```

### Semantic Versioning

Follow semantic versioning for releases:
- MAJOR (1.0.0): Breaking changes
- MINOR (1.1.0): New features
- PATCH (1.0.1): Bug fixes

## GitHub Pages Documentation (Optional)

Host documentation on GitHub Pages:

1. Enable GitHub Pages in Settings
2. Source: `/docs` folder or `main` branch
3. Add documentation files to `/docs`
4. Site will be published at: `https://yourusername.github.io/financial-budget-app`

## Integration with GitHub Enterprise

For self-hosted GitHub Enterprise:

```bash
# Add remote to Enterprise GitHub
git remote add origin https://github.enterprise.com/yourusername/financial-budget-app.git

# Use same workflow as public GitHub
# All GitHub Actions features work the same way
```

## Troubleshooting

### Authentication Issues

```bash
# Generate personal access token
# Go to Settings → Developer settings → Personal access tokens

# Use token for authentication
git remote set-url origin https://<token>@github.com/yourusername/financial-budget-app.git
```

### SSH Issues

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub SSH keys
cat ~/.ssh/id_ed25519.pub | pbcopy

# Use SSH remote
git remote set-url origin git@github.com:yourusername/financial-budget-app.git
```

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code and documentation
3. ✅ Set up GitHub Actions workflows
4. ✅ Configure secrets for CI/CD
5. ✅ Set up branch protection rules
6. ✅ Enable automated deployments
7. ✅ Monitor deployment status

## Support

For GitHub-specific questions:
- [GitHub Docs](https://docs.github.com)
- [GitHub Enterprise Support](https://support.github.com)
- [GitHub Community](https://github.community)
