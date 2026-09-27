FROM python:3.12-slim

WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py ./
COPY pulse ./pulse
COPY data ./data

# Cloud Run and Render both pass the port in $PORT.
ENV PORT=8080 PULSE_CACHE_PATH=/tmp/pulse_cache.sqlite3
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
