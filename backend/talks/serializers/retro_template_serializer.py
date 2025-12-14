from rest_framework import serializers
from talks.models import RetroTemplate


class RetroTemplateSerializer(serializers.ModelSerializer):

    total_retros = serializers.IntegerField(
        source="retros.count",
        read_only=True,
        help_text="Número de retros que usam este template",
    )

    class Meta:
        model = RetroTemplate
        fields = [
            "id",
            "nome",
            "descricao",
            "categorias",
            "is_default",
            "is_system",
            "total_retros",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_system",
            "created_at",
            "updated_at",
            "total_retros",
        ]

    def validate_categorias(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Categorias devem ser uma lista.")

        if len(value) < 1:
            raise serializers.ValidationError(
                "Template deve ter pelo menos uma categoria."
            )

        required_fields = ["name", "slug", "icon", "color"]
        slugs = []

        for idx, categoria in enumerate(value):
            if not isinstance(categoria, dict):
                raise serializers.ValidationError(
                    f"Categoria {idx + 1} deve ser um objeto."
                )

            # Validar campos obrigatórios
            for field in required_fields:
                if field not in categoria:
                    raise serializers.ValidationError(
                        f"Categoria {idx + 1} deve ter o campo '{field}'."
                    )

            # Validar slug único
            slug = categoria["slug"]
            if slug in slugs:
                raise serializers.ValidationError(
                    f"Slug '{slug}' duplicado nas categorias."
                )
            slugs.append(slug)

        return value

    def validate(self, attrs):
        """Impede edição de templates do sistema."""
        if self.instance and self.instance.is_system:
            raise serializers.ValidationError(
                "Templates do sistema não podem ser editados."
            )
        return attrs


class RetroTemplateListSerializer(serializers.ModelSerializer):
    total_retros = serializers.IntegerField(source="retros.count", read_only=True)

    total_categorias = serializers.SerializerMethodField()

    class Meta:
        model = RetroTemplate
        fields = [
            "id",
            "nome",
            "descricao",
            "is_default",
            "is_system",
            "total_categorias",
            "total_retros",
        ]

    def get_total_categorias(self, obj):
        return len(obj.categorias) if obj.categorias else 0
