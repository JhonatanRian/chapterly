"""
Test fixtures for core tests.
"""

import pytest
from django.contrib.auth import get_user_model
from core.models.configuration import SystemConfiguration

User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        username="admin_test",
        email="admin@test.com",
        password="testpass123",
    )


@pytest.fixture
def regular_user(db):
    """Create a regular user."""
    return User.objects.create_user(
        username="user_test",
        email="user@test.com",
        password="testpass123",
    )


@pytest.fixture
def system_config(db):
    """Create and return SystemConfiguration instance."""
    config = SystemConfiguration.objects.create(
        chapter_enabled=True,
        retro_enabled=True,
    )
    return config


@pytest.fixture
def disabled_chapter_config(db):
    """Create SystemConfiguration with chapter disabled."""
    config = SystemConfiguration.objects.create(
        chapter_enabled=False,
        retro_enabled=True,
    )
    return config


@pytest.fixture
def disabled_retro_config(db):
    """Create SystemConfiguration with retro disabled."""
    config = SystemConfiguration.objects.create(
        chapter_enabled=True,
        retro_enabled=False,
    )
    return config
