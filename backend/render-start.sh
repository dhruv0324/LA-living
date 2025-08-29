#!/usr/bin/env bash
# Start script for Render deployment

echo "Starting FastAPI application..."

# Start the FastAPI application
uvicorn main:app --host 0.0.0.0 --port $PORT
