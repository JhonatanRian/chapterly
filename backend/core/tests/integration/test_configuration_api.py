"""
Integration tests for Configuration API.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from core.models.configuration import SystemConfiguration

User = get_user_model()


class ConfigurationAPITest(TestCase):
    """Test Configuration API endpoints."""

    def setUp(self):
        """Set up test fixtures."""
        cache.clear()
        self.client = APIClient()

        # Create users
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@test.com",
            password="admin123",
        )
        self.regular_user = User.objects.create_user(
            username="user",
            email="user@test.com",
            password="user123",
        )

        # Create configuration
        self.config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    def test_get_config_without_authentication(self):
        """Test GET /auth/config/ without authentication."""
        response = self.client.get("/api/auth/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("chapter_enabled", response.data)
        self.assertIn("retro_enabled", response.data)
        self.assertTrue(response.data["chapter_enabled"])
        self.assertTrue(response.data["retro_enabled"])

    def test_get_config_with_authentication(self):
        """Test GET /auth/config/ with authentication."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/auth/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["chapter_enabled"])
        self.assertTrue(response.data["retro_enabled"])

    def test_get_config_creates_default_if_not_exists(self):
        """Test GET /auth/config/ creates default config if none exists."""
        SystemConfiguration.objects.all().delete()

        response = self.client.get("/api/auth/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["chapter_enabled"])
        self.assertTrue(response.data["retro_enabled"])

        # Verify config was created in database
        self.assertEqual(SystemConfiguration.objects.count(), 1)

    def test_update_config_as_admin(self):
        """Test PATCH /auth/config/update/ as admin user."""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            "chapter_enabled": False,
            "retro_enabled": True,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["chapter_enabled"])
        self.assertTrue(response.data["retro_enabled"])

        # Verify database was updated
        self.config.refresh_from_db()
        self.assertFalse(self.config.chapter_enabled)

    def test_update_config_as_regular_user_fails(self):
        """Test PATCH /auth/config/update/ as regular user fails."""
        self.client.force_authenticate(user=self.regular_user)

        data = {
            "chapter_enabled": False,
            "retro_enabled": False,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify database was NOT updated
        self.config.refresh_from_db()
        self.assertTrue(self.config.chapter_enabled)
        self.assertTrue(self.config.retro_enabled)

    def test_update_config_without_authentication_fails(self):
        """Test PATCH /auth/config/update/ without authentication fails."""
        data = {
            "chapter_enabled": False,
            "retro_enabled": False,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_config_validation_at_least_one_enabled(self):
        """Test validation: at least one module must be enabled."""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            "chapter_enabled": False,
            "retro_enabled": False,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_update_config_partial_update_chapter_only(self):
        """Test partial update: only chapter_enabled."""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            "chapter_enabled": False,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["chapter_enabled"])
        self.assertTrue(response.data["retro_enabled"])  # Should remain unchanged

    def test_update_config_partial_update_retro_only(self):
        """Test partial update: only retro_enabled."""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            "retro_enabled": False,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["chapter_enabled"])  # Should remain unchanged
        self.assertFalse(response.data["retro_enabled"])

    def test_update_config_invalidates_cache(self):
        """Test that updating config invalidates cache."""
        self.client.force_authenticate(user=self.admin_user)

        # Cache the config
        SystemConfiguration.get_config()

        # Update config
        data = {
            "chapter_enabled": False,
            "retro_enabled": True,
        }
        response = self.client.patch("/api/auth/config/update/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Get config again - should reflect new value (not cached)
        cached_config = SystemConfiguration.get_config()
        self.assertFalse(cached_config.chapter_enabled)
