# Docker Deployment Guide

This guide covers deploying the Financial Budgeting Application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/financial-budget-app.git
cd financial-budget-app
```

2. **Create environment file**

```bash
cp .env.example .env.production
# Edit .env.production with your configuration
```

3. **Build and start services**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

4. **Access the application**

Open browser to `https://yourdomain.com`

## Docker Configuration

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://budget_user:password@db:5432/budget_app
      SESSION_SECRET: dev_secret_key_here
      ENCRYPTION_KEY: dev_64_char_hex_string_here
      STRIPE_PUBLIC_KEY: pk_test_...
      STRIPE_SECRET_KEY: sk_test_...
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - budget-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: budget_user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: budget_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - budget-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U budget_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:

networks:
  budget-network:
    driver: bridge
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql2://budget_user:${DB_PASSWORD}@db:3306/budget_app
      SESSION_SECRET: ${SESSION_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - budget-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: mariadb:10.5
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: budget_app
      MYSQL_USER: budget_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mariadb_data:/var/lib/mysql
    networks:
      - budget-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./www:/usr/share/nginx/html:ro
    depends_on:
      - app
    networks:
      - budget-network

volumes:
  mariadb_data:

networks:
  budget-network:
    driver: bridge
```

## Nginx Configuration

Create `nginx.conf` for reverse proxy and SSL:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Compression
        gzip on;
        gzip_types text/html text/plain text/css text/javascript application/javascript application/json;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## SSL Certificate Setup

### Using Let's Encrypt with Docker

```bash
# Install Certbot
docker run --rm -v /path/to/ssl:/etc/letsencrypt certbot/certbot certonly \
  --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --email your-email@example.com
```

Or use docker-compose service:

```yaml
certbot:
  image: certbot/certbot
  volumes:
    - ./ssl:/etc/letsencrypt
  entrypoint: /bin/sh -c 'certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --agree-tos --email your-email@example.com && certbot renew --dry-run'
```

## Building Docker Image

```bash
# Build image
docker build -t financial-budget-app:latest .

# Build for specific architecture
docker buildx build --platform linux/amd64,linux/arm64 -t yourusername/financial-budget-app:latest .

# Push to Docker Hub
docker push yourusername/financial-budget-app:latest
```

## Running Containers

### Development

```bash
# Start services
docker-compose up

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production

```bash
# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Database Management

### Running Migrations

```bash
# Execute migrations in running container
docker-compose exec app npm run db:push

# With MariaDB config
docker-compose exec app npx drizzle-kit push --config drizzle.config.mariadb.ts
```

### Backing Up Database

```bash
# PostgreSQL backup
docker-compose exec db pg_dump -U budget_user budget_app > backup.sql

# MariaDB backup
docker-compose exec db mysqldump -u budget_user -p budget_app > backup.sql
```

### Restoring Database

```bash
# PostgreSQL restore
cat backup.sql | docker-compose exec -T db psql -U budget_user budget_app

# MariaDB restore
cat backup.sql | docker-compose exec -T db mysql -u budget_user -p budget_app
```

## Scaling with Docker Swarm

### Initialize Swarm

```bash
docker swarm init
```

### Deploy Stack

```bash
docker stack deploy -c docker-compose.yml budget_app
```

### Scale Services

```bash
docker service scale budget_app_app=3
```

## Health Checks

View container health:

```bash
# Check status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health check
docker inspect --format "{{.State.Health.Status}}" container_name
```

## Environment Variables

### Development (.env)

```
NODE_ENV=development
DATABASE_URL=postgresql://budget_user:password@db:5432/budget_app
SESSION_SECRET=dev_secret
ENCRYPTION_KEY=dev_encryption_key_hex
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Production (.env.production)

```
NODE_ENV=production
DATABASE_URL=mysql2://budget_user:strong_password@db:3306/budget_app
SESSION_SECRET=production_random_secret_32_chars_min
ENCRYPTION_KEY=production_64_char_hex_key
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

## Troubleshooting

### Container fails to start

```bash
# Check logs
docker-compose logs app

# Inspect container
docker-compose exec app sh

# Check environment variables
docker-compose exec app env
```

### Database connection errors

```bash
# Test database connection
docker-compose exec app mysql -h db -u budget_user -p budget_app

# Check database service
docker-compose ps db
docker-compose logs db
```

### Permission issues

```bash
# Fix volume permissions
docker-compose exec app chown -R node:node /app

# Rebuild without cache
docker-compose build --no-cache
```

## Production Checklist

- [ ] Set strong passwords for database
- [ ] Generate secure SESSION_SECRET and ENCRYPTION_KEY
- [ ] Configure Stripe API keys (live)
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Enable container restart policies
- [ ] Set resource limits
- [ ] Configure logging
- [ ] Setup backup strategy
- [ ] Test disaster recovery
- [ ] Monitor container health
- [ ] Setup alerting

## Monitoring

### View Logs

```bash
# Follow app logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# View specific time range
docker-compose logs --since 2024-01-15 --until 2024-01-16 app
```

### Container Metrics

```bash
# CPU and memory usage
docker stats

# Detailed information
docker inspect container_name
```

## Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild image
docker-compose build

# Restart services
docker-compose up -d
```

## Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup (removes everything)
docker system prune -a
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Documentation](https://nginx.org/en/docs/)
