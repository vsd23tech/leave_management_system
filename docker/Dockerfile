# syntax=docker/dockerfile:1.7
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates libpq-dev gcc \
  && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir "poetry==1.8.3"

WORKDIR /app

# Copy project metadata first (faster Docker layer caching)
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true \
 && poetry install --no-interaction --no-ansi --no-root

# Now copy the full project
COPY . .

# Install project (if it becomes a package later)
RUN poetry install --no-interaction --no-ansi

EXPOSE 8000

# Expecting app.main:create_app() in the next step
CMD ["poetry", "run", "gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "app.main:create_app()"]
