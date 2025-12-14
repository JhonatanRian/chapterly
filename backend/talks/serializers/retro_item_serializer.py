from core.serializers import UserProfileSerializer
from rest_framework import serializers

from talks.models import Retro, RetroItem


class RetroItemSerializer(serializers.ModelSerializer):
    autor = UserProfileSerializer(read_only=True)
    vote_count = serializers.IntegerField(read_only=True)
    has_voted = serializers.SerializerMethodField()
    categoria_info = serializers.SerializerMethodField()

    class Meta:
        model = RetroItem
        fields = [
            "id",
            "retro",
            "categoria",
            "categoria_info",
            "conteudo",
            "autor",
            "vote_count",
            "has_voted",
            "ordem",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "autor", "created_at", "updated_at"]

    def get_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.has_voted(request.user)
        return False

    def get_categoria_info(self, obj):
        retro = obj.retro
        if retro and retro.template:
            return retro.template.get_categoria_by_slug(obj.categoria)
        return None

    def validate_categoria(self, value):
        retro_id = self.initial_data.get("retro") or (
            self.instance.retro.id if self.instance else None
        )

        if not retro_id:
            return value

        try:
            retro = Retro.objects.select_related("template").get(id=retro_id)
            categoria_valida = retro.template.get_categoria_by_slug(value)
            if not categoria_valida:
                raise serializers.ValidationError(
                    f"Categoria '{value}' não existe no template desta retro."
                )
        except Retro.DoesNotExist:
            raise serializers.ValidationError("Retro não encontrada.")

        return value


class RetroItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetroItem
        fields = ["categoria", "conteudo", "ordem"]

    def validate_categoria(self, value):
        retro = self.context.get("retro")
        if retro and retro.template:
            categoria_valida = retro.template.get_categoria_by_slug(value)
            if not categoria_valida:
                categorias_disponiveis = [
                    cat["slug"] for cat in retro.template.categorias
                ]
                raise serializers.ValidationError(
                    f"Categoria inválida. Use uma das seguintes: {', '.join(categorias_disponiveis)}"
                )
        return value
