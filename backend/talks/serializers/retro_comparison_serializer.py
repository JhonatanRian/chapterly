from rest_framework import serializers
from talks.models import Retro, RetroItem


class RetroComparisonRequestSerializer(serializers.Serializer):
    """
    Serializer para request de comparação.
    """

    retro_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=2,
        max_length=10,
        help_text="IDs das retrospectivas a comparar (mín 2, máx 10)",
    )

    def validate_retro_ids(self, value):
        # Verificar IDs únicos
        if len(value) != len(set(value)):
            raise serializers.ValidationError("IDs duplicados não são permitidos.")

        # Verificar que retros existem
        existing_count = Retro.objects.filter(id__in=value).count()
        if existing_count != len(value):
            raise serializers.ValidationError(
                f"Apenas {existing_count} de {len(value)} retrospectivas foram encontradas."
            )

        return value


class RetroSummarySerializer(serializers.ModelSerializer):
    """
    Serializer resumido de retro para response de comparação.
    """

    autor_username = serializers.CharField(source="autor.username", read_only=True)

    class Meta:
        model = Retro
        fields = ["id", "titulo", "data", "status", "autor_username"]


class ActionItemDetailSerializer(serializers.Serializer):
    """
    Detalhes de action item para tracking.
    """

    id = serializers.IntegerField()
    conteudo = serializers.CharField()
    autor_username = serializers.CharField()
    status = serializers.ChoiceField(
        choices=["resolvido", "recorrente", "novo", "nao_action_item"]
    )
    similaridade = serializers.FloatField(required=False)
    retro_origem = serializers.IntegerField()


class ActionItemsTrackingSerializer(serializers.Serializer):
    """
    Análise de tracking de action items.
    """

    total_action_items_anterior = serializers.IntegerField()
    resolvidos = serializers.IntegerField()
    recorrentes = serializers.IntegerField()
    novos = serializers.IntegerField()
    taxa_resolucao = serializers.FloatField(help_text="Percentual de resolução (0-100)")
    detalhes = ActionItemDetailSerializer(many=True)


class RecurrentItemSerializer(serializers.Serializer):
    """
    Item recorrente entre retros.
    """

    conteudo = serializers.CharField()
    categoria = serializers.CharField()
    frequencia = serializers.IntegerField(help_text="Quantas retros tem este item")
    retros = serializers.ListField(
        child=serializers.IntegerField(), help_text="IDs das retros onde aparece"
    )
    similaridade_media = serializers.FloatField()


class RecurrenceAnalysisSerializer(serializers.Serializer):
    """
    Análise de problemas recorrentes.
    """

    total_recorrencias = serializers.IntegerField()
    por_categoria = serializers.DictField(
        child=serializers.IntegerField(),
        help_text="Número de recorrências por categoria",
    )
    itens_recorrentes = RecurrentItemSerializer(many=True)


class CategoryTendencySerializer(serializers.Serializer):
    """
    Tendência de uma categoria específica.
    """

    categoria = serializers.CharField()
    categoria_nome = serializers.CharField()
    tendencia = serializers.ChoiceField(
        choices=["crescente", "estável", "decrescente", "insuficiente"],
        help_text="crescente: +10%, estável: -10% a +10%, decrescente: < -10%",
    )
    variacao_percentual = serializers.FloatField(
        help_text="Variação do primeiro para o último"
    )
    valores = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Valores absolutos por retro (ordem cronológica)",
    )


class RetroComparisonResponseSerializer(serializers.Serializer):
    """
    Response completo de comparação.
    """

    retros_comparadas = RetroSummarySerializer(many=True)
    action_items_tracking = ActionItemsTrackingSerializer(required=False)
    problemas_recorrentes = RecurrenceAnalysisSerializer()
    tendencias_categorias = serializers.DictField(
        child=CategoryTendencySerializer(),
        help_text="Tendências indexadas por slug da categoria",
    )
    periodo_analise = serializers.DictField(
        help_text="Data inicial e final do período analisado"
    )
