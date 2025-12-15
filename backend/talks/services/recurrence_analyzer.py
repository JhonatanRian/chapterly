from typing import List, Dict, Any
from collections import defaultdict
from talks.models import RetroItem
from talks.services import TextSimilarityService


class RecurrenceAnalyzer:
    """
    Service para análise de problemas recorrentes entre múltiplas retros.
    Identifica itens similares que aparecem em diferentes retrospectivas.
    """

    SIMILARITY_THRESHOLD = 0.85
    MIN_OCCURRENCES = 2  # Mínimo de ocorrências para considerar recorrente

    @staticmethod
    def analyze(retro_ids: List[int]) -> Dict[str, Any]:
        """
        Analisa recorrências de problemas entre retros.

        Args:
            retro_ids: IDs das retrospectivas a analisar

        Returns:
            dict: Análise de recorrências
        """
        # Buscar todos os items das retros (exceto action_items)
        items = list(
            RetroItem.objects.filter(retro_id__in=retro_ids)
            .exclude(categoria="action_items")  # Action items têm tracking próprio
            .select_related("autor", "retro")
            .order_by("retro_id", "categoria", "id")  # Ordenação explícita
        )

        # Agrupar por categoria para análise separada
        items_por_categoria = defaultdict(list)
        for item in items:
            # Converter para dict para consistência com resto do código
            item_dict = {
                "id": item.id,
                "conteudo": item.conteudo,
                "categoria": item.categoria,
                "retro_id": item.retro_id,
                "autor__username": item.autor.username,
            }
            items_por_categoria[item.categoria].append(item_dict)

        # Encontrar recorrências
        recorrencias = []
        recorrencias_por_categoria = defaultdict(int)
        items_processados = set()

        for categoria, categoria_items in items_por_categoria.items():
            # Comparar TODOS os pares de items na categoria
            for i, item_i in enumerate(categoria_items):
                if item_i["id"] in items_processados:
                    continue

                # Buscar items similares na mesma categoria
                similar_items = []
                retros_com_item = set([item_i["retro_id"]])

                # Comparar com todos os outros items (não só os posteriores)
                for j, item_j in enumerate(categoria_items):
                    # Pular o mesmo item e items já processados
                    if i == j or item_j["id"] in items_processados:
                        continue

                    # Não comparar items da mesma retro
                    if item_j["retro_id"] == item_i["retro_id"]:
                        continue

                    similarity = TextSimilarityService.calculate_similarity(
                        item_i["conteudo"], item_j["conteudo"]
                    )

                    if similarity >= RecurrenceAnalyzer.SIMILARITY_THRESHOLD:
                        similar_items.append({**item_j, "similarity": similarity})
                        retros_com_item.add(item_j["retro_id"])

                # Se encontrou recorrência (aparece em múltiplas retros)
                if len(retros_com_item) >= RecurrenceAnalyzer.MIN_OCCURRENCES:
                    items_processados.add(item_i["id"])

                    # Calcular similaridade média
                    similaridades = [si["similarity"] for si in similar_items]
                    similaridade_media = (
                        sum(similaridades) / len(similaridades)
                        if similaridades
                        else 1.0
                    )

                    recorrencias.append(
                        {
                            "conteudo": item_i["conteudo"],
                            "categoria": categoria,
                            "frequencia": len(retros_com_item),
                            "retros": list(retros_com_item),
                            "similaridade_media": round(similaridade_media, 3),
                        }
                    )

                    recorrencias_por_categoria[categoria] += 1

        # Ordenar recorrências por frequência (mais recorrente primeiro)
        recorrencias.sort(key=lambda x: x["frequencia"], reverse=True)

        return {
            "total_recorrencias": len(recorrencias),
            "por_categoria": dict(recorrencias_por_categoria),
            "itens_recorrentes": recorrencias,
        }
