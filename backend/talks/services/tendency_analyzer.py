from typing import List, Dict, Any
from collections import defaultdict
from django.db import models
from talks.models import Retro, RetroItem


class TendencyAnalyzer:
    """
    Service para análise de tendências por categoria entre retros.
    Identifica se categorias estão crescendo, estáveis ou decrescendo.
    """

    CRESCENTE_THRESHOLD = 0.10  # +10%
    DECRESCENTE_THRESHOLD = -0.10  # -10%

    @staticmethod
    def analyze(retro_ids: List[int]) -> Dict[str, Any]:
        """
        Analisa tendências de categorias entre retros.

        Args:
            retro_ids: IDs das retrospectivas em ordem cronológica

        Returns:
            dict: Tendências por categoria
        """
        # Buscar retros para pegar categorias do template
        retros = (
            Retro.objects.filter(id__in=retro_ids)
            .select_related("template")
            .order_by("data")
        )

        if not retros:
            return {}

        # Assumir que todas usam o mesmo template (ou usar primeiro)
        template = retros.first().template
        categorias = template.categorias if template else []

        # Contar items por categoria por retro
        contagens = defaultdict(lambda: defaultdict(int))

        for retro in retros:
            items_count = (
                RetroItem.objects.filter(retro=retro)
                .values("categoria")
                .annotate(count=models.Count("id"))
            )

            for item in items_count:
                contagens[item["categoria"]][retro.id] = item["count"]

        # Calcular tendências
        tendencias = {}

        for categoria_info in categorias:
            categoria_slug = categoria_info["slug"]
            categoria_nome = categoria_info["name"]

            # Valores em ordem cronológica
            valores = [contagens[categoria_slug].get(retro.id, 0) for retro in retros]

            # Calcular tendência
            if len(valores) < 2 or all(v == 0 for v in valores):
                # Insuficiente se menos de 2 retros ou todos os valores são 0
                tendencia = "insuficiente"
                variacao = 0.0
            elif valores[0] == 0:
                # Se começa com 0 mas tem valores depois, qualquer aumento é crescente
                primeiro = valores[0]
                ultimo = valores[-1]
                if ultimo > 0:
                    tendencia = "crescente"
                else:
                    tendencia = "estável"
                variacao = 0.0  # Não calculável com divisão por zero
            else:
                primeiro = valores[0]
                ultimo = valores[-1]

                variacao = ((ultimo - primeiro) / primeiro) * 100

                if variacao > (TendencyAnalyzer.CRESCENTE_THRESHOLD * 100):
                    tendencia = "crescente"
                elif variacao < (TendencyAnalyzer.DECRESCENTE_THRESHOLD * 100):
                    tendencia = "decrescente"
                else:
                    tendencia = "estável"

            tendencias[categoria_slug] = {
                "categoria": categoria_slug,
                "categoria_nome": categoria_nome,
                "tendencia": tendencia,
                "variacao_percentual": round(variacao, 2),
                "valores": valores,
            }

        return tendencias
