from rest_framework.serializers import ModelSerializer

from talks.models import Tag


class TagSerializer(ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "nome", "cor", "slug", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]
