FROM python:3.11-slim

LABEL maintainer="OpenClaw" \
      description="OpenClaw background worker container (RQ)"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r openclaw && useradd -r -g openclaw openclaw

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend/ ./

RUN mkdir -p /data /assets logs && chown -R openclaw:openclaw /app /data /assets

USER openclaw

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import redis, os; r=redis.from_url(os.environ.get('REDIS_URL','redis://redis:6379/0')); r.ping()" || exit 1

CMD ["rq", "worker", "--url", "${REDIS_URL:-redis://redis:6379/0}", "--with-scheduler", "openclaw"]
