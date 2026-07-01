#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "==================================="
echo "🚀 Starting ERP Deployment"
echo "==================================="

# 1. Pull Latest Code
echo "=> Pulling latest code..."
# git pull origin main

# 2. Backend Setup
echo "=> Setting up Backend..."
cd backend
npm install --production

# 3. Database Initialization & Schema Sync
echo "=> Running Database Initialization..."
npm run db:init

cd ..

# 4. Frontend Setup
echo "=> Setting up Frontend..."
cd frontend
npm install
npm run build
cd ..

# 5. PM2 Restart
echo "=> Restarting PM2 processes..."
# Check if PM2 is managing the app already
if pm2 show erp-backend > /dev/null; then
    pm2 restart erp-backend
else
    cd backend
    pm2 start server.js --name "erp-backend"
    cd ..
fi

pm2 save

# 6. Verify Health Check
echo "=> Verifying Health Status..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/api/health || echo "Failed")

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Health check passed! Deployment Successful."
else
    echo "❌ Health check failed! HTTP Status: $HTTP_STATUS"
    exit 1
fi

echo "==================================="
echo "🎉 Deployment Complete!"
echo "==================================="
