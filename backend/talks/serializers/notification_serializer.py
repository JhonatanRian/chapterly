from rest_framework.serializers import ModelSerializer

from talks.models import Notification
from talks.serializers.idea_serializer import IdeaListSerializer


class NotificationSerializer(ModelSerializer):
    idea = IdeaListSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "tipo",
            "mensagem",
            "idea",
            "lido",
            "created_at",
        ]
        read_only_fields = ["id", "tipo", "mensagem", "idea", "created_at"]
