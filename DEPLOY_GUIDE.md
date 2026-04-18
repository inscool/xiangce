# Xiangce Deployment Guide

This guide is the single source of truth for deploying the project from GitHub.

Important:

- The GitHub repository root is not the Next.js app root.
- The real Next.js project lives in the `web/` directory.
- Always run `npm` and `pm2` commands inside `web/`.

## Repository Structure

```text
xiangce/
└─ web/
   ├─ package.json
   ├─ src/
   ├─ prisma/
   └─ ...
```

## Recommended Server Directory

Recommended clone directory:

```bash
/www/wwwroot/xiangce
```

After cloning, the real app directory is:

```bash
/www/wwwroot/xiangce/web
```

Do not run the app from a directory that already ends with `/web` and then clone another repo into it.

Wrong example:

```bash
/www/wwwroot/opencode-xiangce/web
└─ web/
```

That causes the common `web/web` nesting issue.

## First-Time Deployment

### One-command installer

From the repository root, you can run:

```bash
chmod +x install.sh
./install.sh
```

This script will:

- enter the real app directory `web/`
- install dependencies
- generate Prisma client
- run migrations
- backfill album short IDs
- build the production app
- start or restart PM2 on port `4000`

You still need to review and fill `.env` for production.

### 1. Clone the repository

```bash
cd /www/wwwroot
git clone https://github.com/inscool/xiangce.git
cd xiangce/web
```

### 2. Create the real environment file

```bash
cp .env.example .env
nano .env
```

Fill the real values in `.env`.

### 3. Install dependencies

```bash
npm install
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run database migrations

```bash
npx prisma migrate deploy
```

### 6. Backfill old album short IDs if needed

```bash
npm run db:backfill-shortids
```

### 7. Build production files

```bash
npm run build
```

### 8. Start PM2 on port 4000

```bash
pm2 start npm --name xiangce -- run start
pm2 save
```

## Standard Update Deployment

When updating an existing server deployment:

```bash
cd /www/wwwroot/xiangce
git pull
cd web
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run db:backfill-shortids
npm run build
pm2 restart xiangce --update-env
pm2 save
```

## PM2 Commands

### View status

```bash
pm2 ls
```

### View logs

```bash
pm2 logs xiangce --lines 100
```

### Restart app

```bash
pm2 restart xiangce --update-env
```

### Remove and recreate app

```bash
pm2 delete xiangce
cd /www/wwwroot/xiangce/web
pm2 start npm --name xiangce -- run start
pm2 save
```

## Nginx Reverse Proxy

The domain should proxy to:

```text
http://127.0.0.1:4000
```

If the site does not update after deployment, check:

- PM2 really runs on port `4000`
- Nginx points to `4000`
- reverse proxy cache is disabled for HTML pages

## Important Notes

### 1. Never deploy from the wrong directory

Always confirm:

```bash
pwd
```

The correct working directory for app commands should end with:

```bash
/xiangce/web
```

### 2. Never run build from the repository root

Wrong:

```bash
cd /www/wwwroot/xiangce
npm run build
```

Correct:

```bash
cd /www/wwwroot/xiangce/web
npm run build
```

### 3. If `.next` is missing, build first

If PM2 shows:

```text
Could not find a production build in the '.next' directory
```

run:

```bash
cd /www/wwwroot/xiangce/web
npm run build
pm2 restart xiangce --update-env
```

### 4. If images uploaded with local storage show 404

Check:

- `STORAGE_DRIVER="local"`
- `LOCAL_UPLOAD_DIR="public/uploads"`
- `APP_BASE_URL` is correct

Then rebuild and restart:

```bash
cd /www/wwwroot/xiangce/web
npm run build
pm2 restart xiangce --update-env
```

## Useful Quick Commands

### Confirm PM2 process name

```bash
pm2 ls
```

Current expected process name:

```text
xiangce
```

### Confirm port 4000 is listening

```bash
ss -ltnp | grep 4000
```

### Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Checklist

Before asking for help, check these first:

- Are you inside the correct directory: `.../xiangce/web`?
- Did you run `npm run build` successfully?
- Does `.next/` exist?
- Is PM2 process name `xiangce`?
- Is Nginx proxying to `127.0.0.1:4000`?
- Did you run `pm2 restart xiangce --update-env`?

If all of the above are correct, the deployment should be stable.

## Docker Compose (Local / Staging)

If you prefer container-based iteration, use the repository-level compose file.

### 1) Prepare env file

```bash
cp web/.env.example web/.env
```

### 2) Start all services

```bash
docker compose up -d --build
```

Services:

- `xiangce-web` on `http://localhost:4000`
- `xiangce-db` on `localhost:5432`

### 3) Common iteration commands

```bash
# rebuild app after code changes
docker compose up -d --build web

# check app logs
docker compose logs -f web

# stop containers
docker compose down

# full reset (database + uploads)
docker compose down -v
```

### 4) Data persistence

- PostgreSQL volume: `xiangce-pgdata`
- Local uploads volume: `xiangce-uploads`

This keeps data between restarts unless you run `docker compose down -v`.

## Docker Compose Dev Mode (Hot Reload)

When you are iterating quickly and need immediate bug checks, use dev compose mode:

```bash
cp web/.env.example web/.env
docker compose -f docker-compose.dev.yml up -d
```

This mode:

- mounts local `web/` source into container
- runs `npm run dev` in container
- enables polling-based file watching for Windows/macOS compatibility

Common commands:

```bash
# logs
docker compose -f docker-compose.dev.yml logs -f web

# restart web only
docker compose -f docker-compose.dev.yml restart web

# stop dev containers
docker compose -f docker-compose.dev.yml down

# full reset
docker compose -f docker-compose.dev.yml down -v
```
