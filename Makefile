.PHONY: help setup lint fmt test run docker-up docker-down migrate rev head dbcheck

help:
	@echo "Common tasks:"
	@echo "  make setup       - install deps + pre-commit"
	@echo "  make lint        - run linters & security checks"
	@echo "  make fmt         - format code (black/isort/ruff)"
	@echo "  make test        - run pytest"
	@echo "  make run         - run flask dev server on :8000"
	@echo "  make docker-up   - build & start app+db via compose"
	@echo "  make docker-down - stop compose"
	@echo "  make rev msg='x' - create alembic revision (autogen)"
	@echo "  make head        - upgrade db to head"
	@echo "  make dbcheck     - curl /healthz and /dbcheck"

setup:
	poetry install
	poetry run pre-commit install

lint:
	poetry run pre-commit run --all-files

fmt:
	poetry run black .
	poetry run isort .
	poetry run ruff --fix .

test:
	poetry run pytest

run:
	poetry run flask --app "app.main:create_app()" run --port 8000

docker-up:
	cd docker && docker compose up --build

docker-down:
	cd docker && docker compose down

rev:
	poetry run alembic revision --autogenerate -m "$(msg)"

head:
	poetry run alembic upgrade head

dbcheck:
	curl -s http://localhost:8000/healthz && echo
	curl -s http://localhost:8000/dbcheck && echo
