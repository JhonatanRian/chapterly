"""
Unit tests for SystemConfiguration model.
"""

from django.test import TestCase, override_settings
from django.core.cache import cache
from core.models.configuration import SystemConfiguration


class SystemConfigurationModelTest(TestCase):
    """Test SystemConfiguration model behavior."""

    def setUp(self):
        """Clear cache before each test."""
        cache.clear()

    def tearDown(self):
        """Clear cache after each test."""
        cache.clear()

    def test_singleton_pattern(self):
        """Test that only one configuration instance can exist."""
        config1 = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

        # Verify pk is always 1
        self.assertEqual(config1.pk, 1)

        # Create another instance and save - should update the existing one (pk=1)
        config2 = SystemConfiguration(
            chapter_enabled=False,
            retro_enabled=False,
        )
        config2.save()

        # Still only one instance exists with pk=1
        self.assertEqual(SystemConfiguration.objects.count(), 1)
        self.assertEqual(config2.pk, 1)

        # Verify config2 updated config1's values
        config1.refresh_from_db()
        self.assertFalse(config1.chapter_enabled)
        self.assertFalse(config1.retro_enabled)

    def test_get_config_returns_instance(self):
        """Test get_config() returns configuration instance."""
        SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=False,
        )

        config = SystemConfiguration.get_config()

        self.assertIsNotNone(config)
        self.assertTrue(config.chapter_enabled)
        self.assertFalse(config.retro_enabled)

    def test_get_config_creates_default_if_not_exists(self):
        """Test get_config() creates default configuration if none exists."""
        # Ensure no config exists
        SystemConfiguration.objects.all().delete()

        config = SystemConfiguration.get_config()

        self.assertIsNotNone(config)
        self.assertTrue(config.chapter_enabled)
        self.assertTrue(config.retro_enabled)

    def test_get_config_uses_cache(self):
        """Test get_config() uses cache for performance."""
        SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

        # First call - caches
        config1 = SystemConfiguration.get_config()

        # Modify database directly (bypassing save signal)
        SystemConfiguration.objects.filter(pk=1).update(chapter_enabled=False)

        # Second call - should return cached value
        config2 = SystemConfiguration.get_config()
        self.assertTrue(config2.chapter_enabled)  # Still True from cache

        # Clear cache
        cache.clear()

        # Third call - should fetch from database
        config3 = SystemConfiguration.get_config()
        self.assertFalse(config3.chapter_enabled)  # Now False from DB

    def test_save_invalidates_cache(self):
        """Test save() invalidates cache."""
        config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

        # Cache the config
        SystemConfiguration.get_config()

        # Modify and save (should invalidate cache)
        config.chapter_enabled = False
        config.save()

        # Get config again - should reflect new value
        refreshed_config = SystemConfiguration.get_config()
        self.assertFalse(refreshed_config.chapter_enabled)

    def test_is_chapter_enabled(self):
        """Test is_chapter_enabled() method."""
        config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=False,
        )

        self.assertTrue(config.is_chapter_enabled())

        config.chapter_enabled = False
        config.save()

        self.assertFalse(config.is_chapter_enabled())

    def test_is_retro_enabled(self):
        """Test is_retro_enabled() method."""
        config = SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        self.assertTrue(config.is_retro_enabled())

        config.retro_enabled = False
        config.save()

        self.assertFalse(config.is_retro_enabled())

    def test_str_representation(self):
        """Test __str__() method."""
        config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=False,
        )

        expected = "Configuração do Sistema"
        self.assertEqual(str(config), expected)

    def test_default_values(self):
        """Test default field values."""
        config = SystemConfiguration.objects.create()

        self.assertTrue(config.chapter_enabled)
        self.assertTrue(config.retro_enabled)
