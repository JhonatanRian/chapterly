from rest_framework import serializers

from talks.models import Retro, RetroItem


class RetroMinimalSerializer(serializers.ModelSerializer):
    autor = serializers.SerializerMethodField()

    class Meta:
        model = Retro
        fields = ["id", "titulo", "status", "data", "autor", "created_at"]
        read_only_fields = fields

    def get_autor(self, obj):
        return {"username": obj.autor.username} if obj.autor else None


class RetroItemMinimalSerializer(serializers.ModelSerializer):
    autor = serializers.SerializerMethodField()
    retro = serializers.IntegerField(source="retro.id", read_only=True)

    class Meta:
        model = RetroItem
        fields = [
            "id",
            "retro",
            "categoria",
            "conteudo",
            "autor",
            "vote_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_autor(self, obj):
        return {"username": obj.autor.username} if obj.autor else None


class RetroMetricsSerializer(serializers.Serializer):
    total_retros = serializers.IntegerField(help_text="Total de retrospectivas criadas")
    total_items = serializers.IntegerField(
        help_text="Total de itens criados em todas as retrospectivas"
    )
    total_votos = serializers.IntegerField(
        help_text="Total de votos dados em todos os itens"
    )
    media_items_por_retro = serializers.FloatField(
        help_text="Média de itens por retrospectiva"
    )
    media_participantes_por_retro = serializers.FloatField(
        help_text="Média de participantes por retrospectiva"
    )
    taxa_conclusao = serializers.FloatField(
        help_text="Percentual de retrospectivas concluídas (0-100)"
    )
    retros_por_status = serializers.DictField(
        help_text="Distribuição de retrospectivas por status"
    )
    retros_recentes = RetroMinimalSerializer(
        many=True, help_text="5 retrospectivas mais recentes"
    )


class EngagementAnalysisSerializer(serializers.Serializer):
    media_itens_por_pessoa = serializers.FloatField(
        help_text="Média de itens criados por participante único"
    )
    participantes_por_retro = serializers.DictField(
        help_text="Número de participantes por retro {retro_id: count}"
    )
    trend_participacao = serializers.ChoiceField(
        choices=["crescente", "estável", "decrescente"],
        help_text="Tendência comparando últimas 5 vs 5 anteriores",
    )


class PatternAnalysisSerializer(serializers.Serializer):
    itens_por_categoria = serializers.DictField(
        help_text="Distribuição de itens por categoria {categoria: total}"
    )
    top_itens_votados = RetroItemMinimalSerializer(
        many=True,
        help_text="Top 10 itens com maior número de votos",
    )
    total_action_items = serializers.IntegerField(
        help_text="Total de itens na categoria action_items"
    )


class GlobalMetricsResponseSerializer(serializers.Serializer):
    metricas_gerais = RetroMetricsSerializer(
        help_text="Métricas gerais de retrospectivas"
    )
    analise_engajamento = EngagementAnalysisSerializer(
        help_text="Análise de engajamento do time"
    )
    analise_padroes = PatternAnalysisSerializer(
        help_text="Identificação de padrões nas retrospectivas"
    )
