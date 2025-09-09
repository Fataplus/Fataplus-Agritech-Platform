#!/bin/bash

# Start Fataplus Web Backend
# This script handles the Python path correctly

cd "$(dirname "$0")/web-backend"

# Add current directory to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Start the FastAPI server
echo "Starting Fataplus Web Backend..."
echo "API will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"

python3 -c "
import sys
sys.path.insert(0, 'src')
sys.path.insert(0, '.')

if __name__ == '__main__':
    import uvicorn
    from src.main import app
    uvicorn.run(app, host='0.0.0.0', port=8000, reload=True)
"