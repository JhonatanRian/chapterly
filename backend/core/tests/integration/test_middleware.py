"""
Integration tests for FeatureFlagMiddleware.
"""

from django.test import TestCase, RequestFactory, override_settings
from django.http import JsonResponse
from django.core.cache import cache
from core.middleware.feature_flags import FeatureFlagMiddleware
from core.models.configuration import SystemConfiguration


class FeatureFlagMiddlewareTest(TestCase):
    """Test FeatureFlagMiddleware behavior."""

    def setUp(self):
        """Set up test fixtures."""
        cache.clear()
        self.factory = RequestFactory()
        self.get_response = lambda request: JsonResponse({"status": "ok"})
        self.middleware = FeatureFlagMiddleware(self.get_response)

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    def test_middleware_allows_chapter_routes_when_enabled(self):
        """Test middleware allows chapter routes when chapter is enabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

        request = self.factory.get("/api/ideas/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 200)

    def test_middleware_blocks_chapter_routes_when_disabled(self):
        """Test middleware blocks chapter routes when chapter is disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.get("/api/ideas/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)
        self.assertIn("desabilitado", response.content.decode())

    def test_middleware_blocks_chapter_detail_routes_when_disabled(self):
        """Test middleware blocks chapter detail routes when disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.get("/api/ideas/123/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_chapter_nested_routes_when_disabled(self):
        """Test middleware blocks chapter nested routes when disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.post("/api/ideas/123/vote/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_comments_routes_when_chapter_disabled(self):
        """Test middleware blocks comments routes when chapter is disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.get("/api/comments/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_tags_routes_when_chapter_disabled(self):
        """Test middleware blocks tags routes when chapter is disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.get("/api/tags/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)

    def test_middleware_allows_notifications_routes_always(self):
        """Test middleware always allows notifications routes."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=True,
        )

        request = self.factory.get("/api/notifications/")
        response = self.middleware(request)

        # Notifications are always allowed (in ALWAYS_ALLOWED_ROUTES)
        self.assertEqual(response.status_code, 200)

    def test_middleware_allows_retro_routes_when_enabled(self):
        """Test middleware allows retro routes when retro is enabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

        request = self.factory.get("/api/retros/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 200)

    def test_middleware_blocks_retro_routes_when_disabled(self):
        """Test middleware blocks retro routes when retro is disabled."""
        SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=False,
        )

        request = self.factory.get("/api/retros/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 403)

    def test_middleware_always_allows_auth_routes(self):
        """Test middleware always allows auth routes."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=False,
        )

        # Test login
        request = self.factory.post("/api/auth/login/")
        response = self.middleware(request)
        self.assertEqual(response.status_code, 200)

        # Test register
        request = self.factory.post("/api/auth/register/")
        response = self.middleware(request)
        self.assertEqual(response.status_code, 200)

        # Test config
        request = self.factory.get("/api/auth/config/")
        response = self.middleware(request)
        self.assertEqual(response.status_code, 200)

    def test_middleware_always_allows_admin_routes(self):
        """Test middleware always allows admin routes."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=False,
        )

        request = self.factory.get("/admin/")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 200)

    def test_middleware_always_allows_static_routes(self):
        """Test middleware always allows static routes."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=False,
        )

        request = self.factory.get("/static/css/style.css")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 200)

    def test_middleware_always_allows_media_routes(self):
        """Test middleware always allows media routes."""
        SystemConfiguration.objects.create(
            chapter_enabled=False,
            retro_enabled=False,
        )

        request = self.factory.get("/media/image.png")
        response = self.middleware(request)

        self.assertEqual(response.status_code, 200)
