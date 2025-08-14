#!/bin/bash

echo "🚀 Starting E-commerce Application..."
echo

echo "🔄 Starting Redis..."
docker start redis-server
if [ $? -ne 0 ]; then
    echo "❌ Redis container not found. Creating new one..."
    docker run -d -p 6379:6379 --name redis-server redis:7-alpine
fi

echo
echo "⏳ Waiting for Redis to be ready..."
sleep 3

echo
echo "🟢 Starting Backend Server..."
echo "Backend will be available at: http://localhost:3001"
echo
npm run dev 