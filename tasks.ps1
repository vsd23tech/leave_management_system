param(
    [Parameter(Position=0)]
    [ValidateSet('setup','lint','fmt','test','run','docker-up','docker-down','rev','head','dbcheck')]
    [string]$Task,
    [string]$Msg = ""
)

switch ($Task) {
  'setup' {
    poetry install
    poetry run pre-commit install
  }
  'lint' {
    poetry run pre-commit run --all-files
  }
  'fmt' {
    poetry run black .
    poetry run isort .
    poetry run ruff --fix .
  }
  'test' {
    poetry run pytest
  }
  'run' {
    poetry run flask --app "app.main:create_app()" run --port 8000
  }
  'docker-up' {
    Push-Location docker
    docker compose up --build
    Pop-Location
  }
  'docker-down' {
    Push-Location docker
    docker compose down
    Pop-Location
  }
  'rev' {
    if (-not $Msg) { Write-Error "Use -Msg 'your message'"; exit 1 }
    poetry run alembic revision --autogenerate -m "$Msg"
  }
  'head' {
    poetry run alembic upgrade head
  }
  'dbcheck' {
    Invoke-WebRequest -Uri "http://localhost:8000/healthz" -UseBasicParsing | Select-Object -ExpandProperty Content
    Invoke-WebRequest -Uri "http://localhost:8000/dbcheck" -UseBasicParsing | Select-Object -ExpandProperty Content
  }
  default {
    Write-Host "Usage: .\tasks.ps1 <setup|lint|fmt|test|run|docker-up|docker-down|rev|head|dbcheck> [-Msg 'text']"
  }
}
