from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from core.models import SystemConfiguration


class FeatureFlagMiddleware(MiddlewareMixin):
    ROUTE_FEATURE_MAP = {
        "/api/ideas": "chapter_enabled",
        "/api/comments": "chapter_enabled",
        "/api/votes": "chapter_enabled",
        "/api/tags": "chapter_enabled",
        "/api/retros": "retro_enabled",
    }

    ALWAYS_ALLOWED_ROUTES = [
        "/api/auth/",
        "/api/users/",
        "/api/config/",
        "/api/notifications/",
        "/api/upload-image/",
        "/admin/",
        "/api/schema/",
        "/api/docs/",
    ]

    def process_request(self, request):
        path = request.path

        if any(path.startswith(route) for route in self.ALWAYS_ALLOWED_ROUTES):
            return None

        config = SystemConfiguration.get_config()

        for route_prefix, feature_flag in self.ROUTE_FEATURE_MAP.items():
            if path.startswith(route_prefix):
                is_enabled = getattr(config, feature_flag, True)

                if not is_enabled:
                    feature_name = self._get_feature_name(feature_flag)
                    return JsonResponse(
                        {
                            "error": f"Recurso {feature_name} desabilitado",
                            "detail": f"O módulo {feature_name} está desabilitado no sistema.",
                            "feature_flag": feature_flag,
                        },
                        status=403,
                    )

        return None

    @staticmethod
    def _get_feature_name(feature_flag):
        feature_names = {
            "chapter_enabled": "Chapter",
            "retro_enabled": "Retro",
        }
        return feature_names.get(feature_flag, feature_flag)
