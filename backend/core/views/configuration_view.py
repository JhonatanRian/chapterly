from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import SystemConfiguration
from core.permissions import IsAdminUser
from core.serializers import SystemConfigurationSerializer


@extend_schema_view(
    list=extend_schema(
        summary="Obter configuração do sistema",
        description="Retorna a configuração atual do sistema com feature flags.",
    ),
)
class ConfigurationViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action == "update_config":
            return [IsAdminUser()]
        return [AllowAny()]

    def list(self, request):
        config = SystemConfiguration.get_config()
        serializer = SystemConfigurationSerializer(config)
        return Response(serializer.data)

    @extend_schema(
        summary="Atualizar configuração do sistema",
        description="Atualiza feature flags do sistema. Apenas administradores.",
        request=SystemConfigurationSerializer,
        responses={200: SystemConfigurationSerializer},
    )
    @action(detail=False, methods=["patch"], url_path="update")
    def update_config(self, request):
        config = SystemConfiguration.get_config()
        serializer = SystemConfigurationSerializer(
            config, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
