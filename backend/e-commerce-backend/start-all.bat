@echo off
echo 🚀 Starting E-commerce Application...
echo.

echo 🔄 Starting Redis...
docker start redis-server
if %errorlevel% neq 0 (
    echo ❌ Redis container not found. Creating new one...
    docker run -d -p 6379:6379 --name redis-server redis:7-alpine
)

echo.
echo ⏳ Waiting for Redis to be ready...
timeout /t 3 /nobreak >nul

echo.
echo 🟢 Starting Backend Server...
echo Backend will be available at: http://localhost:3001
echo.
npm run dev 