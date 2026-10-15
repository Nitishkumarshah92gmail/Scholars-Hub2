# ==============================================================================
# Scholars Hub - Facebook Architecture Multi-Stage Dockerfile (Backend Subdirectory)
# ==============================================================================

FROM gcc:12 AS cpp-builder

WORKDIR /build
COPY cpp_services/ /build/
RUN g++ -O3 -std=c++17 FeedServiceServer.cpp -o feed_server -lpthread

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=5000

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    software-properties-common \
    apt-transport-https \
    curl \
    gnupg \
    libgomp1 \
    netcat \
    && apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xB41125DE733F9BA6 \
    && add-apt-repository https://dl.hhvm.com/ubuntu \
    && apt-get update && apt-get install -y --no-install-recommends hhvm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=cpp-builder /build/feed_server /app/backend/cpp_services/feed_server
RUN chmod +x /app/backend/cpp_services/feed_server

COPY . /app/backend
RUN chmod +x /app/backend/entrypoint.sh

EXPOSE 5000
EXPOSE 9090

ENTRYPOINT ["/app/backend/entrypoint.sh"]
