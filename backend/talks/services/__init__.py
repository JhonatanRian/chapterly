from difflib import SequenceMatcher


class TextSimilarityService:
    """
    Service para análise de similaridade entre textos.
    Usado para detectar problemas recorrentes.
    """

    DEFAULT_THRESHOLD = 0.85  # 85% de similaridade

    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """
        Calcula similaridade entre dois textos (0.0 a 1.0).

        Args:
            text1: Primeiro texto
            text2: Segundo texto

        Returns:
            float: Valor de 0.0 (totalmente diferente) a 1.0 (idêntico)
        """
        # Normalizar textos
        t1 = text1.strip().lower()
        t2 = text2.strip().lower()

        # Usar SequenceMatcher do difflib
        matcher = SequenceMatcher(None, t1, t2)
        return matcher.ratio()

    @staticmethod
    def are_similar(
        text1: str, text2: str, threshold: float = DEFAULT_THRESHOLD
    ) -> bool:
        """
        Verifica se dois textos são similares baseado em threshold.

        Args:
            text1: Primeiro texto
            text2: Segundo texto
            threshold: Valor mínimo para considerar similar (0.0 a 1.0)

        Returns:
            bool: True se similaridade >= threshold
        """
        similarity = TextSimilarityService.calculate_similarity(text1, text2)
        return similarity >= threshold

    @staticmethod
    def find_similar_items(
        target_text: str, items: list, threshold: float = DEFAULT_THRESHOLD
    ) -> list:
        """
        Encontra items similares ao texto alvo.

        Args:
            target_text: Texto a buscar
            items: Lista de dicts com 'conteudo' key
            threshold: Valor mínimo de similaridade

        Returns:
            list: Lista de dicts com items similares + campo 'similarity'
        """
        similar = []
        for item in items:
            similarity = TextSimilarityService.calculate_similarity(
                target_text, item.get("conteudo", "")
            )
            if similarity >= threshold:
                similar.append({**item, "similarity": similarity})

        # Ordenar por similaridade decrescente
        return sorted(similar, key=lambda x: x["similarity"], reverse=True)
