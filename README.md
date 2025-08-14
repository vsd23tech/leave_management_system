# Leave Management System — Dev Setup

This repository uses **Python 3.12**, **Flask**, **SQLAlchemy**, **Alembic**, and **Poetry** for dependency management.  
CI: **GitHub Actions**. Containers: **Docker + docker-compose**.

## Prerequisites
- Python 3.12
- Git
- Poetry
- Docker Desktop (or Docker Engine + Compose)

## First-time Setup
```bash
poetry env use 3.12
poetry install
poetry run pre-commit install
