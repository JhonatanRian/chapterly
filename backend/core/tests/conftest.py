"""
Pytest configuration for core tests.
"""

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before each test."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    """Return DRF API client."""
    from rest_framework.test import APIClient

    return APIClient()
