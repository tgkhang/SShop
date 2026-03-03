# API Node.js - Local Setup (Docker + Redis)

This guide helps you run `api-nodejs` locally with Docker services (MongoDB and Redis).

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (or Docker Engine)

## 2) Install dependencies

From `api-nodejs` folder:

```bash
npm install
```

## 3) Configure environment

Copy example env file:

```bash
cp .env.example .env
```

If you use Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Recommended minimum values in `.env` for local Docker setup:

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/shop?authSource=admin
DATABASE_NAME=shop
LOCAL_DEV_APP_HOST=localhost
LOCAL_DEV_APP_PORT=8010
BUILD_MODE=dev

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

> Keep all secrets private and never commit your real `.env`.

## 4) Start MongoDB and Redis with Docker

### Option A - `docker run` (quickest)

```bash
docker network create sshop-net
```

```bash
docker run -d --name sshop-mongo --network sshop-net -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:7
```

```bash
docker run -d --name sshop-redis --network sshop-net -p 6379:6379 redis:7-alpine
```

### Option B - Docker Compose (recommended for repeat use)

Create `docker-compose.dev.yml`:

```yaml
services:
  mongo:
    image: mongo:7
    container_name: sshop-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:7-alpine
    container_name: sshop-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
```

Run:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## 5) Run the API

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run production
```

## 6) Verify everything is working

- API health: `http://localhost:8010/health`
- If healthy, response should be: `OK`

Check Docker containers:

```bash
docker ps
```

Check logs:

```bash
docker logs sshop-mongo --tail 100
```

```bash
docker logs sshop-redis --tail 100
```

## 7) Common issues

- Port already used (`27017` or `6379`): stop old containers/processes and restart.
- Mongo auth error: ensure `.env` `MONGODB_URI` username/password match Docker env values.
- Redis connection error: verify Redis container is running and port `6379` is published.
- API starts on wrong port: confirm `LOCAL_DEV_APP_PORT=8010` and run with `npm run dev`.

## 8) Stop services

If you used `docker run`:

```bash
docker stop sshop-mongo sshop-redis && docker rm sshop-mongo sshop-redis
```

If you used Compose:

```bash
docker compose -f docker-compose.dev.yml down
```
