#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$PROJECT_ROOT/web"
PM2_NAME="xiangce"
APP_PORT="4000"

echo "[1/8] Checking project structure"
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Error: package.json not found in $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "[2/8] Checking .env"
if [ ! -f ".env" ]; then
  echo "Warning: .env not found. Creating from .env.example"
  cp .env.example .env
  echo "Please edit $APP_DIR/.env before using production features."
fi

echo "[3/8] Installing dependencies"
npm install

echo "[4/8] Generating Prisma client"
npm run prisma:generate

echo "[5/8] Running database migrations"
npx prisma migrate deploy || true

echo "[6/8] Backfilling album short IDs"
npm run db:backfill-shortids || true

echo "[7/8] Building production app"
npm run build

echo "[8/8] Restarting PM2 service"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  PORT="$APP_PORT" pm2 start npm --name "$PM2_NAME" -- run start
fi

pm2 save

echo ""
echo "Install / deploy finished."
echo "App directory : $APP_DIR"
echo "PM2 service   : $PM2_NAME"
echo "App port      : $APP_PORT"
echo ""
echo "Useful commands:"
echo "  pm2 ls"
echo "  pm2 logs $PM2_NAME --lines 100"
echo "  ss -ltnp | grep $APP_PORT"
