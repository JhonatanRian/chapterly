from rest_framework import serializers

from core.models import SystemConfiguration


class SystemConfigurationSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(
        source="updated_by.username", read_only=True, allow_null=True
    )

    class Meta:
        model = SystemConfiguration
        fields = [
            "id",
            "chapter_enabled",
            "retro_enabled",
            "updated_at",
            "updated_by",
            "updated_by_username",
        ]
        read_only_fields = ["id", "updated_at", "updated_by", "updated_by_username"]

    def validate(self, attrs):
        chapter_enabled = attrs.get(
            "chapter_enabled", self.instance.chapter_enabled if self.instance else True
        )
        retro_enabled = attrs.get(
            "retro_enabled", self.instance.retro_enabled if self.instance else False
        )

        if not chapter_enabled and not retro_enabled:
            raise serializers.ValidationError(
                "Pelo menos um módulo deve estar habilitado (Chapter ou Retro)."
            )

        return attrs
