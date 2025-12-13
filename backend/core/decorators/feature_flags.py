from functools import wraps
from rest_framework.response import Response
from rest_framework import status

from core.models import SystemConfiguration


def require_feature(feature_name):
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            config = SystemConfiguration.get_config()

            is_enabled = getattr(config, feature_name, False)

            if not is_enabled:
                feature_display = _get_feature_display_name(feature_name)
                return Response(
                    {
                        "error": f"Recurso {feature_display} desabilitado",
                        "detail": f"O módulo {feature_display} está desabilitado no sistema.",
                        "feature_flag": feature_name,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator


def _get_feature_display_name(feature_name):
    feature_names = {
        "chapter_enabled": "Chapter",
        "retro_enabled": "Retro",
    }
    return feature_names.get(feature_name, feature_name)
