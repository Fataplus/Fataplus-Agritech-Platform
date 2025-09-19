#!/bin/bash
echo "🚀 Starting Fataplus Web Backend..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Start the application
echo "🌐 Starting application..."
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4 --reload
