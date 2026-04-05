FROM python:3.11-slim

# Install system dependencies (minimal for RAM optimization)
RUN apt-get update && apt-get install -y \
    libreoffice-writer-nogui \
    libreoffice-calc-nogui \
    ffmpeg \
    tesseract-ocr \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Configure storage permissions
RUN mkdir -p storage && chmod 777 storage

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default port
EXPOSE 8000

# Production CMD (Single worker for Free Tier RAM safety)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
