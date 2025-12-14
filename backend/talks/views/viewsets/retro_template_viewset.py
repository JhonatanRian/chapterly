from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count

from talks.models import RetroTemplate
from talks.serializers import RetroTemplateSerializer, RetroTemplateListSerializer
from core.decorators import require_feature


class RetroTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RetroTemplate.objects.annotate(retros_count=Count("retros")).order_by(
            "nome"
        )

    def get_serializer_class(self):
        if self.action == "list":
            return RetroTemplateListSerializer
        return RetroTemplateSerializer

    @require_feature("retro_enabled")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def create(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)
        return super().create(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def update(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)

        template = self.get_object()
        if template.is_system:
            return Response(
                {"detail": "Templates do sistema não podem ser editados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def partial_update(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)

        template = self.get_object()
        if template.is_system:
            return Response(
                {"detail": "Templates do sistema não podem ser editados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().partial_update(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def destroy(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)

        template = self.get_object()

        if template.is_system:
            return Response(
                {"detail": "Templates do sistema não podem ser deletados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if template.retros.exists():
            return Response(
                {
                    "detail": (
                        f"Este template está sendo usado por {template.retros.count()} "
                        "retrospectiva(s) e não pode ser deletado."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    @require_feature("retro_enabled")
    def set_default(self, request, pk=None):
        template = self.get_object()
        template.is_default = True
        template.save()

        serializer = self.get_serializer(template)
        return Response(serializer.data)
