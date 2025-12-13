"""
Unit tests for @require_feature decorator.
"""

from unittest.mock import Mock, patch
from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied
from core.decorators.feature_flags import require_feature


class RequireFeatureDecoratorTest(SimpleTestCase):
    """Test @require_feature decorator behavior."""

    def test_decorator_allows_access_when_feature_enabled(self):
        """Test decorator allows access when feature is enabled."""

        @require_feature("chapter_enabled")
        def mock_action(viewset_instance, request):
            return "success"

        # Mock configuration with chapter enabled
        mock_config = Mock()
        mock_config.is_chapter_enabled.return_value = True

        with patch(
            "core.decorators.feature_flags.SystemConfiguration.get_config",
            return_value=mock_config,
        ):
            mock_viewset = Mock()
            mock_request = Mock()

            result = mock_action(mock_viewset, mock_request)

            self.assertEqual(result, "success")

    def test_decorator_blocks_access_when_feature_disabled(self):
        """Test decorator blocks access when feature is disabled."""

        @require_feature("chapter_enabled")
        def mock_action(viewset_instance, request):
            return "success"

        # Mock configuration with chapter disabled
        mock_config = Mock()
        mock_config.is_chapter_enabled.return_value = False
        mock_config.chapter_enabled = False

        with patch(
            "core.decorators.feature_flags.SystemConfiguration.get_config",
            return_value=mock_config,
        ):
            mock_viewset = Mock()
            mock_request = Mock()

            result = mock_action(mock_viewset, mock_request)

            # Should return Response with 403 status
            self.assertEqual(result.status_code, 403)
            self.assertIn("desabilitado", str(result.data))

    def test_decorator_with_retro_enabled_feature(self):
        """Test decorator with retro_enabled feature."""

        @require_feature("retro_enabled")
        def mock_action(viewset_instance, request):
            return "retro_success"

        # Mock configuration with retro enabled
        mock_config = Mock()
        mock_config.is_retro_enabled.return_value = True

        with patch(
            "core.decorators.feature_flags.SystemConfiguration.get_config",
            return_value=mock_config,
        ):
            mock_viewset = Mock()
            mock_request = Mock()

            result = mock_action(mock_viewset, mock_request)

            self.assertEqual(result, "retro_success")

    def test_decorator_with_retro_disabled_feature(self):
        """Test decorator blocks retro when disabled."""

        @require_feature("retro_enabled")
        def mock_action(viewset_instance, request):
            return "retro_success"

        # Mock configuration with retro disabled
        mock_config = Mock()
        mock_config.is_retro_enabled.return_value = False
        mock_config.retro_enabled = False

        with patch(
            "core.decorators.feature_flags.SystemConfiguration.get_config",
            return_value=mock_config,
        ):
            mock_viewset = Mock()
            mock_request = Mock()

            result = mock_action(mock_viewset, mock_request)

            # Should return Response with 403 status
            self.assertEqual(result.status_code, 403)
            self.assertIn("desabilitado", str(result.data))

    def test_decorator_with_invalid_feature_name(self):
        """Test decorator with invalid feature name."""

        @require_feature("invalid_feature")
        def mock_action(viewset_instance, request):
            return "success"

        mock_config = Mock(spec=["chapter_enabled", "retro_enabled"])
        mock_config.chapter_enabled = True
        mock_config.retro_enabled = True

        with patch(
            "core.decorators.feature_flags.SystemConfiguration.get_config",
            return_value=mock_config,
        ):
            mock_viewset = Mock()
            mock_request = Mock()

            # Invalid feature name should default to blocking access (getattr returns False for non-existent attrs)
            result = mock_action(mock_viewset, mock_request)
            self.assertEqual(result.status_code, 403)

    def test_decorator_preserves_function_metadata(self):
        """Test decorator preserves wrapped function metadata."""

        @require_feature("chapter_enabled")
        def mock_action(viewset_instance, request):
            """Mock action docstring."""
            return "success"

        # Check that function name and docstring are preserved
        self.assertEqual(mock_action.__name__, "mock_action")
        self.assertEqual(mock_action.__doc__, "Mock action docstring.")
