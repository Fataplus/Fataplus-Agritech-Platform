# AI Services Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH /app

# Set work directory
WORKDIR /app

# Install basic system dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    git \
  && rm -rf /var/lib/apt/lists/*

# Copy and install basic Python dependencies first
COPY requirements.txt .
# Install basic dependencies only for now
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    pydantic==2.5.0 \
    httpx==0.25.2 \
    python-dotenv==1.0.0 \
    requests==2.31.0 \
    celery==5.3.4 \
    redis==5.0.1 \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1 \
    black==23.11.0 \
    isort==5.12.0 \
    mypy==1.7.1

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Health check (disabled for development)
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#   CMD python -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "-m", "uvicorn", "core.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
