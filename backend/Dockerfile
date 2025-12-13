# Multi-stage Dockerfile for Chapterly Django Backend
# Stage 1: Builder - Install dependencies
FROM ghcr.io/astral-sh/uv:alpine AS builder

ENV UV_PYTHON_INSTALL_DIR=/usr/local/python
ENV UV_CACHE_DIR=/app/.cache

WORKDIR /app

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    python3-dev \
    curl

COPY pyproject.toml ./
COPY uv.lock ./
COPY .python-version ./

RUN uv python install

RUN uv sync --locked --compile-bytecode

ENV PATH="/app/.venv/bin:$PATH"

# Stage 2: Runtime
FROM ghcr.io/astral-sh/uv:alpine

ENV UV_PYTHON_INSTALL_DIR=/usr/local/python
ENV UV_CACHE_DIR=/app/.cache

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libpq \
    postgresql-client \
    tzdata \
    curl

COPY --from=builder /usr/local/python /usr/local/python
COPY --from=builder /app/.cache /app/.cache

COPY --from=builder /app/.venv /app/.venv

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

# Copy Django application files
COPY . .

# Create directories and set permissions
RUN mkdir -p /app/media /app/staticfiles && \
    adduser -D -u 1000 django && \
    chown -R django:django /app

USER django

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python manage.py check || exit 1

# Default command (can be overridden in docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
