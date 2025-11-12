# Build stage
FROM rust:1.91-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . .

# Build release binaries
RUN cargo build --release --bin revolt-delta
RUN cargo build --release --bin revolt-bonfire
RUN cargo build --release --bin revolt-autumn
RUN cargo build --release --bin revolt-january
RUN cargo build --release --bin revolt-gifbox
RUN cargo build --release --bin revolt-voice-ingress

# Runtime stage
FROM ubuntu:24.04

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binaries from builder
COPY --from=builder /app/target/release/revolt-delta /usr/local/bin/
COPY --from=builder /app/target/release/revolt-bonfire /usr/local/bin/
COPY --from=builder /app/target/release/revolt-autumn /usr/local/bin/
COPY --from=builder /app/target/release/revolt-january /usr/local/bin/
COPY --from=builder /app/target/release/revolt-gifbox /usr/local/bin/
COPY --from=builder /app/target/release/revolt-voice-ingress /usr/local/bin/

# Copy configuration
COPY Revolt.toml /app/
COPY livekit.yaml /app/

# Create startup script
RUN echo '#!/bin/bash\n\
revolt-delta & \n\
revolt-bonfire & \n\
revolt-autumn & \n\
revolt-january & \n\
revolt-gifbox & \n\
revolt-voice-ingress & \n\
wait' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 14702 14703 14704 14705 14706

CMD ["/app/start.sh"]
