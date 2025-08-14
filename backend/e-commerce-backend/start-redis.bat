@echo off
echo Starting Redis with Docker...
docker run -d -p 6379:6379 --name redis-server redis:7-alpine
echo.
echo Redis is now running on localhost:6379
echo To stop Redis: docker stop redis-server
echo To remove Redis: docker rm redis-server
pause 