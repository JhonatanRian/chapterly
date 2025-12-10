from rest_framework import serializers

from core.serializers.user_profile_serializer import UserProfileSerializer


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()
