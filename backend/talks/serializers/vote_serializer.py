from rest_framework.serializers import ModelSerializer

from talks.models import Vote
from talks.serializers.user_serializer import UserSerializer


class VoteSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vote
        fields = ["id", "user", "idea", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
