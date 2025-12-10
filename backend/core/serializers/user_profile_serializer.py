from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    ideias_criadas_count = serializers.IntegerField(
        source="ideias_criadas.count", read_only=True
    )
    apresentacoes_count = serializers.IntegerField(
        source="ideias_apresentando.count", read_only=True
    )
    votos_count = serializers.IntegerField(source="votos.count", read_only=True)

    ideias_criadas = serializers.SerializerMethodField()
    ideias_apresentando = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "avatar",
            "date_joined",
            "ideias_criadas_count",
            "apresentacoes_count",
            "votos_count",
            "ideias_criadas",
            "ideias_apresentando",
        ]
        read_only_fields = ["id", "username", "date_joined"]

    def get_ideias_criadas(self, obj):
        from talks.serializers import IdeaListSerializer

        ideias = obj.ideias_criadas.all().order_by("-created_at")[:5]
        return IdeaListSerializer(ideias, many=True, context=self.context).data

    def get_ideias_apresentando(self, obj):
        from talks.serializers import IdeaListSerializer

        ideias = obj.ideias_apresentando.all().order_by("-created_at")[:5]
        return IdeaListSerializer(ideias, many=True, context=self.context).data
