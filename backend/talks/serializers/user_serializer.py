from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "avatar", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class UserStatsSerializer(serializers.ModelSerializer):
    ideias_criadas_count = serializers.IntegerField(
        source="ideias_criadas.count", read_only=True
    )
    apresentacoes_count = serializers.IntegerField(
        source="ideias_apresentando.count", read_only=True
    )
    votos_count = serializers.IntegerField(source="votos.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "ideias_criadas_count",
            "apresentacoes_count",
            "votos_count",
        ]
        read_only_fields = ["id"]
