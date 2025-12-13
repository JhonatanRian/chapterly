"""
Integration tests for CommentViewSet feature protection.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from talks.models import Idea, Comment, Tag
from core.models.configuration import SystemConfiguration

User = get_user_model()


class CommentViewSetFeatureProtectionTest(TestCase):
    """Test CommentViewSet actions are protected by feature flags."""

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

        # Create comment
        self.comment = Comment.objects.create(
            idea=self.idea,
            user=self.user,
            conteudo="Test comment",
        )

        # Create configuration with chapter enabled
        self.config = SystemConfiguration.objects.create(
            chapter_enabled=True,
            retro_enabled=True,
        )

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    def test_create_comment_allowed_when_chapter_enabled(self):
        """Test POST /comments/ works when chapter enabled."""
        self.client.force_authenticate(user=self.other_user)

        data = {
            "idea": self.idea.id,
            "conteudo": "New comment content",
        }

        response = self.client.post("/api/comments/", data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["conteudo"], "New comment content")

    def test_create_comment_blocked_when_chapter_disabled(self):
        """Test POST /comments/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.other_user)

        data = {
            "idea": self.idea.id,
            "conteudo": "New comment content",
        }

        response = self.client.post("/api/comments/", data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Middleware returns JsonResponse, check content not data
        self.assertIn("desabilitado", response.content.decode())

    def test_update_comment_allowed_when_chapter_enabled(self):
        """Test PATCH /comments/{id}/ works when chapter enabled."""
        self.client.force_authenticate(user=self.user)

        data = {
            "conteudo": "Updated comment content",
        }

        response = self.client.patch(f"/api/comments/{self.comment.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["conteudo"], "Updated comment content")

    def test_update_comment_blocked_when_chapter_disabled(self):
        """Test PATCH /comments/{id}/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.user)

        data = {
            "conteudo": "Updated comment content",
        }

        response = self.client.patch(f"/api/comments/{self.comment.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_comment_allowed_when_chapter_enabled(self):
        """Test DELETE /comments/{id}/ works when chapter enabled."""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(f"/api/comments/{self.comment.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify comment was deleted
        self.assertFalse(Comment.objects.filter(id=self.comment.id).exists())

    def test_delete_comment_blocked_when_chapter_disabled(self):
        """Test DELETE /comments/{id}/ blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.user)

        response = self.client.delete(f"/api/comments/{self.comment.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify comment was NOT deleted
        self.assertTrue(Comment.objects.filter(id=self.comment.id).exists())

    def test_list_comments_not_affected_by_decorator(self):
        """Test GET /comments/ is not affected by @require_feature decorator."""
        # Note: Middleware handles blocking, not decorator
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/comments/")

        # Should work because middleware allows when chapter enabled
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_comment_not_affected_by_decorator(self):
        """Test GET /comments/{id}/ is not affected by @require_feature decorator."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/comments/{self.comment.id}/")

        # Should work because middleware allows when chapter enabled
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_nested_comment_creation_allowed_when_chapter_enabled(self):
        """Test creating nested comment works when chapter enabled."""
        self.client.force_authenticate(user=self.other_user)

        data = {
            "idea": self.idea.id,
            "conteudo": "Nested comment",
            "parent": self.comment.id,
        }

        response = self.client.post("/api/comments/", data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["parent"], self.comment.id)

    def test_nested_comment_creation_blocked_when_chapter_disabled(self):
        """Test creating nested comment blocked when chapter disabled."""
        # Disable chapter
        self.config.chapter_enabled = False
        self.config.save()
        cache.clear()

        self.client.force_authenticate(user=self.other_user)

        data = {
            "idea": self.idea.id,
            "conteudo": "Nested comment",
            "parent": self.comment.id,
        }

        response = self.client.post("/api/comments/", data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
