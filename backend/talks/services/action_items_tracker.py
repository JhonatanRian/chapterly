from typing import List, Dict, Any
from talks.models import RetroItem
from talks.services import TextSimilarityService


class ActionItemsTracker:
    """
    Service para tracking de action items entre retrospectivas.
    Identifica quais foram resolvidos, recorrentes ou novos.
    """

    SIMILARITY_THRESHOLD = 0.85

    @staticmethod
    def analyze(
        retros_ordenadas: List[int], action_items_slug: str = "action_items"
    ) -> Dict[str, Any]:
        """
        Analisa action items entre retros consecutivas.

        Args:
            retros_ordenadas: IDs das retros em ordem cronológica
            action_items_slug: Slug da categoria de action items no template

        Returns:
            dict: Resultado da análise de tracking
        """
        if len(retros_ordenadas) < 2:
            return {
                "total_action_items_anterior": 0,
                "resolvidos": 0,
                "recorrentes": 0,
                "novos": 0,
                "taxa_resolucao": 0.0,
                "detalhes": [],
            }

        # Pegar action items da penúltima retro (anterior)
        retro_anterior_id = retros_ordenadas[-2]
        retro_atual_id = retros_ordenadas[-1]

        items_anteriores = list(
            RetroItem.objects.filter(
                retro_id=retro_anterior_id, categoria=action_items_slug
            )
            .select_related("autor", "retro")
            .values("id", "conteudo", "autor__username", "retro_id")
        )

        items_atuais = list(
            RetroItem.objects.filter(
                retro_id=retro_atual_id, categoria=action_items_slug
            )
            .select_related("autor", "retro")
            .values("id", "conteudo", "autor__username", "retro_id")
        )

        # Tracking
        resolvidos = []
        recorrentes = []
        novos = []

        # Processar items anteriores
        for item_ant in items_anteriores:
            similar_items = TextSimilarityService.find_similar_items(
                item_ant["conteudo"],
                items_atuais,
                ActionItemsTracker.SIMILARITY_THRESHOLD,
            )

            if similar_items:
                # Recorrente (ainda aparece na atual)
                recorrentes.append(
                    {
                        "id": item_ant["id"],
                        "conteudo": item_ant["conteudo"],
                        "autor_username": item_ant["autor__username"],
                        "status": "recorrente",
                        "similaridade": similar_items[0]["similarity"],
                        "retro_origem": item_ant["retro_id"],
                    }
                )
            else:
                # Resolvido (não aparece mais)
                resolvidos.append(
                    {
                        "id": item_ant["id"],
                        "conteudo": item_ant["conteudo"],
                        "autor_username": item_ant["autor__username"],
                        "status": "resolvido",
                        "retro_origem": item_ant["retro_id"],
                    }
                )

        # Items novos (não existiam na anterior)
        ids_recorrentes = {r["id"] for r in recorrentes}
        for item_atual in items_atuais:
            # Verificar se é similar a algum item anterior
            similar_to_previous = TextSimilarityService.find_similar_items(
                item_atual["conteudo"],
                items_anteriores,
                ActionItemsTracker.SIMILARITY_THRESHOLD,
            )

            if not similar_to_previous:
                novos.append(
                    {
                        "id": item_atual["id"],
                        "conteudo": item_atual["conteudo"],
                        "autor_username": item_atual["autor__username"],
                        "status": "novo",
                        "retro_origem": item_atual["retro_id"],
                    }
                )

        # Calcular taxa de resolução
        total_anteriores = len(items_anteriores)
        taxa_resolucao = (
            (len(resolvidos) / total_anteriores * 100) if total_anteriores > 0 else 0.0
        )

        return {
            "total_action_items_anterior": total_anteriores,
            "resolvidos": len(resolvidos),
            "recorrentes": len(recorrentes),
            "novos": len(novos),
            "taxa_resolucao": round(taxa_resolucao, 2),
            "detalhes": resolvidos + recorrentes + novos,
        }
