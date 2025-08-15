#!/bin/sh

# Ensure output is not buffered
export PYTHONUNBUFFERED=1

# Function to log with timestamp and flush output
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to wait for a service to be available
wait_for_service() {
  local host="$1"
  local port="$2"
  local timeout="${3:-30}"
  
  log "Waiting for $host:$port to be available..."
  
  for i in $(seq 1 $timeout); do
    if nc -z "$host" "$port" > /dev/null 2>&1; then
      log "$host:$port is available!"
      return 0
    fi
    log "Waiting... ($i/$timeout)"
    sleep 1
  done
  
  log "Timeout waiting for $host:$port"
  return 1
}

log "Starting EventHub API container..."

# Wait for PostgreSQL to be ready
wait_for_service postgres 5432 30

if [ $? -eq 0 ]; then
  log "Database is ready!"

  log "Pushing database schema..."
  pnpx prisma db push
  
  if [ $? -eq 0 ]; then
    log "Database schema updated successfully!"
    log "Starting NestJS application..."
    exec node dist/main
  else
    log "Schema push failed!"
    exit 1
  fi
else
  log "Database is not available. Exiting..."
  exit 1
fi
