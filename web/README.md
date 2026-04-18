# Opencode Xiangce (Web)

Photo album platform with:
- Credentials auth via NextAuth
- SMTP verification mail on signup
- S3-compatible storage (R2 / OSS via S3 API)
- Public profile pages and album pages
- Dashboard for albumized management and batch direct-link copy

## Design Guidelines

Project UI and interaction rules are documented in:

- `docs/design-system.md`

Use this file as the source of truth for:
- backend Chinese UI
- public English UI
- album-centered workflow
- dashboard layout rules
- upload and batch-operation interaction patterns

## Local Development

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://localhost:4000`.

## Docker Local Deployment (Recommended for fast iteration)

Docker files are provided at:

- `../docker-compose.yml`
- `Dockerfile`

Quick start from repository root:

```bash
cp web/.env.example web/.env
docker compose up -d --build
```

Then open `http://localhost:4000`.

Useful commands:

```bash
# rebuild only web container after code updates
docker compose up -d --build web

# view logs
docker compose logs -f web

# stop all services
docker compose down

# stop and remove volumes (reset local DB/uploads)
docker compose down -v
```

Notes:

- In Docker Compose, `DATABASE_URL` is overridden to use `db` service host automatically.
- Uploaded files are persisted in docker volume `xiangce-uploads`.
- Postgres data is persisted in docker volume `xiangce-pgdata`.

## Docker Dev Mode (Hot Reload, no rebuild each edit)

For active development, use the dedicated dev compose file:

```bash
cp web/.env.example web/.env
docker compose -f docker-compose.dev.yml up -d
```

This mode mounts local source code into the container and runs `npm run dev` directly.
Code edits will trigger Next.js dev reload automatically.

Useful dev commands:

```bash
# view dev logs
docker compose -f docker-compose.dev.yml logs -f web

# restart only web dev service
docker compose -f docker-compose.dev.yml restart web

# stop dev stack
docker compose -f docker-compose.dev.yml down

# full dev reset (db + node_modules + uploads volumes)
docker compose -f docker-compose.dev.yml down -v
```

## Required Environment Variables (.env)

For local development, copy `.env.example` to `.env` and fill values.

### Database
- `DATABASE_URL` PostgreSQL connection string.

### Auth
- `NEXTAUTH_URL` Public site URL, for example `https://your-domain.com`.
- `NEXTAUTH_SECRET` Random long secret string.
- `APP_BASE_URL` Base URL used to build verification links.
- `ADMIN_EMAIL` Optional bootstrap admin email.
- `ADMIN_USERNAME` Optional bootstrap admin username.
- `ADMIN_PASSWORD` Optional bootstrap admin password.

### SMTP
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` or `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### S3 / Object Storage (R2 / OSS S3 endpoint)
- `STORAGE_DRIVER` `local` or `s3`
- `S3_REGION` (R2 often uses `auto`)
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE` (`true` for some OSS setups, `false` for R2 usually)
- `S3_PRESIGNED_EXPIRES` Presigned URL expiry (seconds), e.g. `300`.

### Local Storage
- `LOCAL_UPLOAD_DIR` Local upload directory under the project root, default `public/uploads`

### CDN
- `CDN_BASE_URL` Optional CDN domain for direct links, e.g. `https://cdn.example.com`

If `STORAGE_DRIVER=local`, uploads use local disk storage and direct links fall back to `APP_BASE_URL` / `NEXTAUTH_URL`.
If `STORAGE_DRIVER=s3` and `CDN_BASE_URL` is not set, the app falls back to the S3 endpoint URL automatically.

Note for local storage: `LOCAL_UPLOAD_DIR` should usually be under `public/`, for example `public/uploads`, so uploaded files can be served directly by Next.js.

### Admin bootstrap (optional)
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

If these are not set, `npm run admin:create` will create/update a default admin:
- email: `admin@local.dev`
- username: `admin`
- password: `Admin@123456`

Log in and change this password immediately.

## PM2 Deployment (Baota / BT Panel)

Detailed deployment steps are documented in the repository root:

- `../DEPLOY_GUIDE.md`

Build first:

```bash
npm install
npm run build
```

Run with PM2 cluster mode:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

`ecosystem.config.js` is already configured with:
- Cluster mode (`exec_mode: "cluster"`)
- Multi-process (`instances: "max"`)
- Auto restart and memory guard

## Core Routes

- `/dashboard` user console (storage progress, album create, album upload, move images, batch direct-link copy)
- `/:username` public profile page
- `/album/:id` public album page
