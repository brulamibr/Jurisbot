#!/bin/bash
set -e

echo "=== JurisBot Deploy ==="

cd /var/www/jurisbot

echo ">> Pulling latest changes..."
git pull origin main

echo ">> Installing dependencies..."
npm install

echo ">> Generating Prisma client..."
npm run db:generate

echo ">> Pushing schema changes..."
npm run db:push

echo ">> Building..."
npm run build

echo ">> Restarting PM2..."
pm2 restart jurisbot

echo "=== Deploy complete ==="
