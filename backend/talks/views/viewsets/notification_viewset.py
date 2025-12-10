from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from talks.models import Notification
from talks.serializers import (
    NotificationSerializer,
)


@extend_schema(tags=["notifications"])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo", "lido"]

    def get_queryset(self):
        return (
            Notification.objects.filter(user=self.request.user)
            .select_related("user", "idea")
            .order_by("-created_at")
        )

    @extend_schema(
        summary="Notificações não lidas",
        description="Retorna apenas notificações não lidas do usuário",
    )
    @action(detail=False, methods=["get"])
    def unread(self, request):
        unread_notifications = self.get_queryset().filter(lido=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Marcar como lida",
        description="Marca uma notificação específica como lida",
        request=None,
    )
    @action(detail=True, methods=["patch"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.lido = True
        notification.save()
        return Response({"detail": "Notificação marcada como lida."})

    @extend_schema(
        summary="Marcar todas como lidas",
        description="Marca todas as notificações do usuário como lidas",
        request=None,
    )
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(lido=False).update(lido=True)
        return Response({"detail": f"{updated} notificações marcadas como lidas."})
