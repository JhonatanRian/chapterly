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
    """
    Serializer para criação de itens de retrospectiva.

    Validações:
    - Categoria deve existir no template da retro
    - Conteúdo não pode ser duplicado na mesma retro/categoria
      (comparação case-insensitive, ignorando espaços extras)

    Exemplo de erro de duplicata:
    {
        "conteudo": [
            "Já existe um item com este conteúdo na categoria.
             Evite duplicatas para manter a retro organizada."
        ]
    }
    """

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

    def validate_conteudo(self, value):
        """
        Valida que o conteúdo não é duplicado na mesma retro/categoria.
        Comparação case-insensitive e ignorando espaços extras.
        """
        retro = self.context.get("retro")
        categoria = self.initial_data.get("categoria")

        if not retro or not categoria:
            return value

        # Normalizar conteúdo: remover espaços extras e converter para lowercase
        conteudo_normalizado = value.strip().lower()

        # Buscar itens existentes na mesma retro/categoria
        itens_existentes = RetroItem.objects.filter(
            retro=retro, categoria=categoria
        ).values_list("conteudo", flat=True)

        # Comparar com conteúdos normalizados
        for item_conteudo in itens_existentes:
            if item_conteudo.strip().lower() == conteudo_normalizado:
                raise serializers.ValidationError(
                    "Já existe um item com este conteúdo na categoria. "
                    "Evite duplicatas para manter a retro organizada."
                )

        return value
