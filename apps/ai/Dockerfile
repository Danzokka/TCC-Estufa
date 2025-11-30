# IoT Greenhouse AI Service
# Smart Irrigation with LSTM predictions

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir flask-cors gunicorn

# Copy application code
COPY . .

# Create directory for models if not exists
RUN mkdir -p models/saved

# Environment variables with defaults
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app_service.py
ENV AI_SERVICE_PORT=5001
ENV BACKEND_URL=http://api:5000
ENV ESP32_IP=192.168.0.87
ENV ESP32_PORT=8080
ENV GREENHOUSE_ID=""
ENV PLANT_TYPE=default
ENV TARGET_MOISTURE=60
ENV PULSE_DURATION=0.5
ENV PULSE_WAIT=60
ENV AUTO_START_MONITOR=false

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Start with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--threads", "4", "--timeout", "120", "app_service:app"]