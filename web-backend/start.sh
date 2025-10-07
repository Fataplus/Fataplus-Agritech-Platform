#!/bin/bash

# Fataplus Web Backend Startup Script
# This script ensures proper Python path setup before starting uvicorn

cd /app
export PYTHONPATH=/app:$PYTHONPATH

# Change to src directory so imports work correctly
cd src

# Test import before starting
echo "Testing imports..."
python -c "import auth.routes; print('✅ Auth import successful')"
python -c "import main; print('✅ Main import successful')"

# Start uvicorn from src directory
echo "Starting uvicorn..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
