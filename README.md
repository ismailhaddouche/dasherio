# 🍽️ DisherIo

**Restaurant Management System** - A full-stack solution for restaurant operations including POS, KDS, TAS, and Totem ordering.

[![CI/CD](https://github.com/disherio/disherio-refactor/actions/workflows/ci.yml/badge.svg)](https://github.com/disherio/disherio-refactor/actions/workflows/ci.yml)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [API Documentation](#api-documentation)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Caddy (Reverse Proxy)                │
│                    Ports: 80, 443                           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      ┌────────▼──────┐              ┌───────▼────────┐
      │   Frontend    │              │    Backend     │
      │   (Angular)   │              │   (Express)    │
      │   Port: 4200  │              │   Port: 3000   │
      └───────────────┘              └───────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    MongoDB      │
                                    │    Port: 27017  │
                                    └─────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Angular 21, TypeScript, TailwindCSS, Socket.io Client |
| **Backend** | Node.js, Express, TypeScript, Socket.io |
| **Database** | MongoDB 7 |
| **Auth** | JWT, CASL (Authorization) |
| **Reverse Proxy** | Caddy 2 |
| **Container** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 24+
- Docker Compose 2.20+
- Git

### 1. Clone and Configure

```bash
git clone https://github.com/disherio/disherio-refactor.git
cd disherio-refactor

# Create environment file
cp .env.example .env

# Edit with your settings
nano .env
```

### 2. Start Services

```bash
# Production deployment
./scripts/deploy.sh production

# Or manually with Docker Compose
docker compose -f docker-compose.prod.yml up -d
```

### 3. Verify Installation

```bash
# Health check
./scripts/health-check.sh all

# Access application
open http://localhost
```

---

## 🛠️ Development

### Local Development Setup

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install --legacy-peer-deps

# Start MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

# Start backend (in backend/)
npm run dev

# Start frontend (in frontend/)
npm start
```

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| API Documentation | http://localhost:3000/api-docs |

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📦 Deployment

### Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| **Staging** | `develop` | https://staging.disherio.com |
| **Production** | `main` + tags | https://disherio.com |

### Automated Deployment (GitHub Actions)

The CI/CD pipeline automatically:

1. **Lint & Type Check** - Validates TypeScript on every push
2. **Run Tests** - Executes Jest (backend) and Vitest (frontend)
3. **Build Images** - Creates optimized Docker images
4. **Deploy** - Pushes to staging (develop) or production (tags)

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy specific version to production
./scripts/deploy.sh production v1.2.3

# Deploy from local source
./scripts/deploy.sh production local
```

### Docker Image Registry

Images are published to GitHub Container Registry:

```bash
# Pull latest images
docker pull ghcr.io/disherio/disherio-refactor/backend:latest
docker pull ghcr.io/disherio/disherio-refactor/frontend:latest

# Pull specific version
docker pull ghcr.io/disherio/disherio-refactor/backend:v1.2.3
```

---

## 🔐 Environment Variables

### Required Variables

Create a `.env` file in the project root:

```bash
# ============================================
# Application Settings
# ============================================
NODE_ENV=production
PORT=80
HTTPS_PORT=443

# ============================================
# Security
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES=8h

# ============================================
# Database
# ============================================
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=secure-password-here
MONGODB_URI=mongodb://admin:secure-password@mongo:27017/disherio?authSource=admin

# ============================================
# Frontend
# ============================================
FRONTEND_URL=http://localhost

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
```

### Variable Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | HTTP port | `80` |
| `HTTPS_PORT` | HTTPS port | `443` |
| `JWT_SECRET` | JWT signing key | Required |
| `JWT_EXPIRES` | Token expiration | `8h` |
| `MONGO_ROOT_USER` | MongoDB admin user | `admin` |
| `MONGO_ROOT_PASS` | MongoDB admin password | Required |
| `FRONTEND_URL` | Frontend base URL | `http://localhost` |
| `LOG_LEVEL` | Logging level | `info` |

---

## 🏥 Monitoring & Health Checks

### Health Check Script

```bash
# Check all services
./scripts/health-check.sh all

# Check specific component
./scripts/health-check.sh backend
./scripts/health-check.sh frontend
./scripts/health-check.sh mongodb

# Generate JSON report
./scripts/health-check.sh report ./health-report.json

# Check system resources
./scripts/health-check.sh system
```

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Backend health status |
| `GET /api/health` | API health status |

### Container Health

All containers include built-in health checks:

```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"

# View health check logs
docker inspect --format='{{.State.Health}}' disherio_backend
```

### Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker logs -f disherio_backend

# View last 100 lines
docker logs --tail=100 disherio_backend
```

---

## 🔧 Useful Commands

### Docker Management

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# View running containers
docker ps

# Shell into container
docker exec -it disherio_backend sh
```

### Backup & Restore

```bash
# Backup MongoDB
docker exec disherio_mongo mongodump --out=/tmp/backup
docker cp disherio_mongo:/tmp/backup ./backup-$(date +%Y%m%d)

# Restore MongoDB
docker cp ./backup-YYYYMMDD disherio_mongo:/tmp/restore
docker exec disherio_mongo mongorestore /tmp/restore
```

### Update

```bash
# Pull latest images and redeploy
git pull origin main
./scripts/deploy.sh production
```

---

## 📝 API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/dishes` | List all dishes |
| POST | `/api/dishes` | Create dish |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| WS | `/socket.io` | Real-time updates |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow existing TypeScript conventions
- Write tests for new features
- Ensure CI passes before requesting review
- Update documentation for API changes

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

<p align="center">
  <strong>DisherIo</strong> - Making restaurant management simple
  <br>
  Built with ❤️ using Angular, Node.js, and MongoDB
</p>
