#!/usr/bin/env bash
# Build script for Render deployment

echo "Starting build process..."

# Install dependencies
pip install -r requirements.txt

# Create necessary directories if they don't exist
mkdir -p logs

echo "Build completed successfully!"
