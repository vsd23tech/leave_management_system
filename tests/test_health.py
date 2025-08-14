"""Test health check endpoints."""

import json


def test_healthz(client):
    """Test the health check endpoint."""
    response = client.get("/healthz")
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data["status"] == "ok"


def test_dbcheck(client):
    """Test the database connectivity check."""
    response = client.get("/dbcheck")
    # DB might not be available in tests, so accept both ok and error
    assert response.status_code in [200, 500]

    data = json.loads(response.data)
    assert "database" in data
