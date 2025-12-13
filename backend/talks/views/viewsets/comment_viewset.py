from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from core.decorators import require_feature
from talks.models import Comment
from talks.notifications.signals import comment_created
from talks.serializers import (
    CommentSerializer,
)


@extend_schema(tags=["comments"])
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["idea", "user", "parent"]

    def get_queryset(self):
        queryset = Comment.objects.select_related("user", "idea", "parent")

        idea_id = self.request.query_params.get("idea", None)
        if idea_id:
            queryset = queryset.filter(idea_id=idea_id)

        return queryset.order_by("created_at")

    @require_feature("chapter_enabled")
    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)

        comment_created.send(
            sender=self.__class__, comment=comment, user=self.request.user
        )

    @require_feature("chapter_enabled")
    def perform_update(self, serializer):
        if (
            serializer.instance.user != self.request.user
            and not self.request.user.is_staff
        ):
            return Response(
                {"detail": "Você não tem permissão para editar este comentário."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer.save()

    @require_feature("chapter_enabled")
    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "Você não tem permissão para deletar este comentário."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()
