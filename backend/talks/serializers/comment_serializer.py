from rest_framework.serializers import ModelSerializer, SerializerMethodField

from talks.models import Comment
from talks.serializers.user_serializer import UserSerializer


class CommentSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    respostas = SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "user",
            "idea",
            "conteudo",
            "parent",
            "respostas",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_respostas(self, obj):
        if obj.respostas.exists():
            return CommentSerializer(obj.respostas.all(), many=True).data
        return []
