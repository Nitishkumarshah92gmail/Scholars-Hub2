# ==============================================================================
# Scholars Hub - Facebook Architecture Multi-Stage Dockerfile
# Stage 1: C++ Feed Microservice Compilation
# Stage 2: Hack / HHVM + Proxygen High-Performance Runtime
# ==============================================================================

# --- Stage 1: C++ Build Environment ---
FROM gcc:12 AS cpp-builder

WORKDIR /build
COPY backend/cpp_services/ /build/
RUN g++ -O3 -std=c++17 FeedServiceServer.cpp -o feed_server -lpthread

# --- Stage 2: HHVM & Production Web Tier ---
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=5000

# Install dependencies and official HHVM repository
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    software-properties-common \
    apt-transport-https \
    curl \
    gnupg \
    libgomp1 \
    libpthread-stubs0-dev \
    netcat \
    && apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xB41125DE733F9BA6 \
    && add-apt-repository https://dl.hhvm.com/ubuntu \
    && apt-get update && apt-get install -y --no-install-recommends hhvm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy compiled C++ Microservice from Stage 1
COPY --from=cpp-builder /build/feed_server /app/backend/cpp_services/feed_server
RUN chmod +x /app/backend/cpp_services/feed_server

# Copy backend files and configurations
COPY backend /app/backend
COPY frontend/dist /app/frontend/dist

RUN chmod +x /app/backend/entrypoint.sh

EXPOSE 5000
EXPOSE 9090

ENTRYPOINT ["/app/backend/entrypoint.sh"]
