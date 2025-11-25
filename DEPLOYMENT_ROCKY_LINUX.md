# Financial Budgeting App - Rocky Linux Deployment Guide

This guide covers deploying the Financial Budgeting Application on Rocky Linux with MariaDB and Apache.

## System Requirements

- Rocky Linux 8.x or 9.x
- MariaDB 10.5+
- Node.js 18+ LTS
- Apache 2.4+
- Git

## Installation Steps

### 1. System Setup

```bash
# Update system packages
sudo dnf update -y

# Install required tools
sudo dnf install -y git curl wget
sudo dnf groupinstall -y "Development Tools"
```

### 2. Install Node.js

```bash
# Install Node.js LTS (18.x or later)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MariaDB

```bash
# Install MariaDB server
sudo dnf install -y mariadb-server mariadb

# Enable and start the service
sudo systemctl enable mariadb
sudo systemctl start mariadb

# Secure MariaDB installation
sudo mysql_secure_installation

# Verify installation
mysql --version
```

### 4. Create Database and User

```bash
# Connect to MariaDB as root
mysql -u root -p

# Create database
CREATE DATABASE budget_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated application user
CREATE USER 'budget_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON budget_app.* TO 'budget_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 5. Clone and Setup Application

```bash
# Clone the repository
cd /var/www
sudo git clone https://github.com/yourusername/financial-budget-app.git
cd financial-budget-app

# Set ownership
sudo chown -R appuser:appuser .

# Install dependencies
npm install

# Build the application
npm run build
```

### 6. Configure Environment Variables

```bash
# Create .env file for production
sudo nano /var/www/financial-budget-app/.env.production

# Add the following variables:
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql2://budget_user:strong_password_here@localhost:3306/budget_app"
SESSION_SECRET=your_random_session_secret_here
ENCRYPTION_KEY=your_64_character_hex_string_here
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 7. Setup Database Schema

```bash
# For development/testing, use the PostgreSQL-based config
# For production with MariaDB, you'll need to run migrations
# The schema.mariadb.ts file contains MariaDB-compatible schema

cd /var/www/financial-budget-app

# If using Drizzle ORM migrations for MariaDB:
# npx drizzle-kit push --config drizzle.config.mariadb.ts
# Or manually create tables using the schema.mariadb.ts definitions

# Run database migrations (see SQL schema below)
mysql -u budget_user -p budget_app < database-schema.sql
```

### 8. Install and Configure Apache

```bash
# Install Apache
sudo dnf install -y httpd mod_ssl

# Enable Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod ssl

# Enable Apache to start at boot
sudo systemctl enable httpd
```

### 9. Configure Apache Virtual Host

Create `/etc/httpd/conf.d/budget-app.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/financial-budget-app/public

    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Proxy to Node.js application
    <Location />
        ProxyPreserveHost On
        ProxyPass http://127.0.0.1:5000/
        ProxyPassReverse http://127.0.0.1:5000/
        
        # WebSocket support
        ProxyPass ws://127.0.0.1:5000/ timeout=3600
        ProxyPassReverse ws://127.0.0.1:5000/
    </Location>

    # Error and access logs
    ErrorLog /var/log/httpd/budget-app-error.log
    CustomLog /var/log/httpd/budget-app-access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/financial-budget-app/public

    # SSL Configuration
    SSLEngine On
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite HIGH:!aNULL:!MD5

    # Proxy to Node.js application
    <Location />
        ProxyPreserveHost On
        ProxyPass http://127.0.0.1:5000/
        ProxyPassReverse http://127.0.0.1:5000/
        
        # WebSocket support
        ProxyPass ws://127.0.0.1:5000/ timeout=3600
        ProxyPassReverse ws://127.0.0.1:5000/
    </Location>

    # Error and access logs
    ErrorLog /var/log/httpd/budget-app-ssl-error.log
    CustomLog /var/log/httpd/budget-app-ssl-access.log combined
</VirtualHost>
```

### 10. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-apache

# Generate SSL certificate
sudo certbot certonly --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renew certificates
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

### 11. Create Systemd Service

Create `/etc/systemd/system/budget-app.service`:

```ini
[Unit]
Description=Financial Budget Application
After=network.target mariadb.service

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/financial-budget-app
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /var/www/financial-budget-app/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 12. Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start the application
sudo systemctl enable budget-app
sudo systemctl start budget-app

# Start Apache
sudo systemctl restart httpd

# Check status
sudo systemctl status budget-app
sudo systemctl status httpd
```

## Verification

```bash
# Check if Node.js app is running
sudo systemctl status budget-app

# Check if Apache is running
sudo systemctl status httpd

# Test the application
curl -L http://localhost/

# View application logs
sudo journalctl -u budget-app -f

# View Apache logs
sudo tail -f /var/log/httpd/budget-app-error.log
```

## Database Schema for MariaDB

The application requires the following MariaDB setup:

1. **Use the provided `schema.mariadb.ts` file** - This contains all table definitions optimized for MariaDB
2. **Run migrations** - Execute the migration scripts generated from `schema.mariadb.ts`
3. **Key differences from PostgreSQL**:
   - UUID generation: `UUID()` instead of `gen_random_uuid()`
   - JSON storage: `JSON` instead of `JSONB`
   - Enums: Native MySQL enums instead of PostgreSQL enums
   - Timestamps: `DATETIME` instead of `TIMESTAMP`

## Environment Variables

Required variables in `.env.production`:

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | production |
| PORT | Application port (should be 5000) | 5000 |
| DATABASE_URL | MariaDB connection string | mysql2://user:pass@localhost:3306/budget_app |
| SESSION_SECRET | Express session secret | random_64_char_string |
| ENCRYPTION_KEY | 64-character hex string for encryption | 0123456789abcdef... |
| STRIPE_PUBLIC_KEY | Stripe publishable key | pk_live_... |
| STRIPE_SECRET_KEY | Stripe secret key | sk_live_... |
| VITE_STRIPE_PUBLIC_KEY | Frontend Stripe key | pk_live_... |

## Firewall Configuration

```bash
# Open HTTP and HTTPS ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

## Backup and Recovery

### Regular Database Backups

```bash
# Create daily backup script
sudo nano /usr/local/bin/backup-budget-db.sh

#!/bin/bash
BACKUP_DIR="/var/backups/budget-app"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mysqldump -u budget_user -p budget_app | gzip > $BACKUP_DIR/budget_app_$DATE.sql.gz
# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-budget-db.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-budget-db.sh
```

### Restore from Backup

```bash
# Decompress and restore
gunzip < /var/backups/budget-app/budget_app_2024-01-15_02-00-00.sql.gz | mysql -u budget_user -p budget_app
```

## Authentication Setup

### For Self-Hosted GitHub Instance

Since Replit Auth won't work on self-hosted environments, consider:

1. **Local OAuth Provider** - Set up your own OAuth provider
2. **LDAP/Active Directory** - If you have enterprise directory
3. **Simple JWT** - For internal deployments
4. **GitHub OAuth** - If using GitHub Enterprise
5. **OpenID Connect** - Standard OIDC provider setup

Update `server/auth.ts` to use the appropriate authentication method for your environment.

## Troubleshooting

### Database Connection Issues

```bash
# Test MariaDB connection
mysql -u budget_user -p -h localhost -D budget_app

# Check connection details
env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process if needed
sudo kill -9 <PID>
```

### Certificate Renewal Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal
```

### Application Not Starting

```bash
# Check systemd logs
sudo journalctl -u budget-app -n 50

# Check environment variables
sudo systemctl cat budget-app

# Verify permissions
ls -la /var/www/financial-budget-app/
```

## Scaling and Performance

### Enable HTTP/2

Add to Apache configuration:

```apache
Protocols h2 http/1.1
```

### Enable Gzip Compression

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### Database Query Optimization

Add indexes for frequently queried columns:

```sql
CREATE INDEX idx_user_id ON accounts(user_id);
CREATE INDEX idx_user_id ON transactions(user_id);
CREATE INDEX idx_user_id ON categories(user_id);
CREATE INDEX idx_user_id ON subscriptions(user_id);
```

## Support and Updates

For updates:

```bash
# Pull latest code
cd /var/www/financial-budget-app
sudo git pull origin main

# Rebuild
npm install
npm run build

# Restart service
sudo systemctl restart budget-app
```

## Additional Resources

- [Rocky Linux Documentation](https://docs.rockylinux.org/)
- [MariaDB Documentation](https://mariadb.com/docs/)
- [Apache HTTP Server Documentation](https://httpd.apache.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
