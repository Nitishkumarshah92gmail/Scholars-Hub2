#!/bin/bash
set -e

echo "=========================================================="
echo " Starting Scholars Hub - Facebook Architecture Stack"
echo " Web Tier: Hack on HHVM with Proxygen Web Server"
echo " RPC Tier: C++ Multithreaded Feed Ranking Microservice"
echo " Cache Tier: TAO Look-Aside Layer (Redis / In-Memory)"
echo "=========================================================="

# 1. Start High-Performance C++ Feed Microservice on port 9090
echo "[1/2] Starting C++ Feed Microservice on port 9090..."
/app/backend/cpp_services/feed_server 9090 &
CPP_PID=$!
sleep 1

# Check if C++ service is alive
if kill -0 $CPP_PID 2>/dev/null; then
    echo "  -> C++ Feed Microservice running (PID $CPP_PID)"
else
    echo "  -> Warning: C++ microservice failed to start, falling back to internal Hack ranker."
fi

# 2. Configure HHVM Port from Environment ($PORT provided by Render)
PORT=${PORT:-5000}
echo "[2/2] Starting HHVM Proxygen Server on port $PORT..."

# Execute HHVM Proxygen server
exec hhvm \
    -m server \
    -c /app/backend/hhvm.ini \
    -d hhvm.server.port=$PORT \
    /app/backend/index.hack
