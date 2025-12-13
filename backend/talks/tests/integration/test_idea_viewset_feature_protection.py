"""
Integration tests for IdeaViewSet feature protection.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from talks.models import Idea, Tag
from core.models.configuration import SystemConfiguration

User = get_user_model()


class IdeaViewSetFeatureProtectionTest(TestCase):
    """Test IdeaViewSet actions are protected by feature flags."""

    def setUp(self):
        """Set up test fixtures."""
        cache.clear()
        self.client = APIClient()

        # Create users
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="test123",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@test.com",
            password="test123",
        )

        # Create tag
        self.tag = Tag.objects.create(
            nome="Python",
            slug="python",
        )

        # Create idea
        self.idea = Idea.objects.create(
            titulo="Test Idea",
            descricao="Test description",
            conteudo="Test content",
            autor=self.user,
        )
        self.idea.tags.add(self.tag)

        # Create configuration with chapter enabled
        self.config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    def test_vote_action_allowed_when_chapter_enabled(self):
        """Test POST /ideas/{id}/vote/ works when chapter enabled."""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(f"/api/ideas/{self.idea.id}/vote/")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["voted"])

    def test_vote_action_blocked_when_chapter_disabled(self):
        """Test POST /ideas/{id}/vote/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(f"/api/ideas/{self.idea.id}/vote/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Middleware returns JsonResponse, so access content not data
        self.assertIn("desabilitado", response.content.decode())

    def test_volunteer_action_allowed_when_chapter_enabled(self):
        """Test POST /ideas/{id}/volunteer/ works when chapter enabled."""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(f"/api/ideas/{self.idea.id}/volunteer/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user was set as apresentador
        self.idea.refresh_from_db()
        self.assertEqual(self.idea.apresentador, self.other_user)

    def test_volunteer_action_blocked_when_chapter_disabled(self):
        """Test POST /ideas/{id}/volunteer/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(f"/api/ideas/{self.idea.id}/volunteer/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unvolunteer_action_allowed_when_chapter_enabled(self):
        """Test POST /ideas/{id}/unvolunteer/ works when chapter enabled."""
        # Set user as apresentador first
        self.idea.apresentador = self.other_user
        self.idea.save()

        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(f"/api/ideas/{self.idea.id}/unvolunteer/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user was removed as apresentador
        self.idea.refresh_from_db()
        self.assertIsNone(self.idea.apresentador)

    def test_unvolunteer_action_blocked_when_chapter_disabled(self):
        """Test POST /ideas/{id}/unvolunteer/ blocked when chapter disabled."""
        # Set user as apresentador first
        self.idea.apresentador = self.other_user
        self.idea.save()

        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(f"/api/ideas/{self.idea.id}/unvolunteer/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reschedule_action_allowed_when_chapter_enabled(self):
        """Test PATCH /ideas/{id}/reschedule/ works when chapter enabled."""
        self.client.force_authenticate(user=self.user)

        new_date = timezone.now() + timezone.timedelta(days=7)
        data = {
            "data_agendada": new_date.isoformat(),
        }

        response = self.client.patch(f"/api/ideas/{self.idea.id}/reschedule/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify date was updated
        self.idea.refresh_from_db()
        self.assertIsNotNone(self.idea.data_agendada)

    def test_reschedule_action_blocked_when_chapter_disabled(self):
        """Test PATCH /ideas/{id}/reschedule/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.user)

        new_date = timezone.now() + timezone.timedelta(days=7)
        data = {
            "data_agendada": new_date.isoformat(),
        }

        response = self.client.patch(f"/api/ideas/{self.idea.id}/reschedule/", data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_action_not_affected_by_decorator(self):
        """Test GET /ideas/ is not affected by @require_feature decorator."""
        # Note: Middleware handles blocking, not decorator
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/ideas/")

        # Should work because middleware allows when chapter enabled
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_action_not_affected_by_decorator(self):
        """Test GET /ideas/{id}/ is not affected by @require_feature decorator."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/ideas/{self.idea.id}/")

        # Should work because middleware allows when chapter enabled
        self.assertEqual(response.status_code, status.HTTP_200_OK)
