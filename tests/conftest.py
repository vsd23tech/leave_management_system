"""Pytest configuration and shared fixtures."""

import pytest

from app.main import create_app


@pytest.fixture
def app():
    """Create and configure a test app instance."""
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
        }
    )
    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner for the app's Click commands."""
    return app.test_cli_runner()
