from django.test import TestCase
from core.models import User
from django.utils import timezone
from datetime import timedelta

from talks.models import Retro, RetroItem, RetroTemplate
from talks.services import TextSimilarityService
from talks.services.action_items_tracker import ActionItemsTracker
from talks.services.recurrence_analyzer import RecurrenceAnalyzer
from talks.services.tendency_analyzer import TendencyAnalyzer


class TextSimilarityServiceTestCase(TestCase):
    """Testes para TextSimilarityService."""

    def test_identical_texts(self):
        """Textos idênticos devem ter similaridade 1.0"""
        text = "Cards confusos"
        similarity = TextSimilarityService.calculate_similarity(text, text)
        self.assertEqual(similarity, 1.0)

    def test_case_insensitive(self):
        """Deve ignorar diferença de casing"""
        text1 = "Cards confusos"
        text2 = "CARDS CONFUSOS"
        similarity = TextSimilarityService.calculate_similarity(text1, text2)
        self.assertEqual(similarity, 1.0)

    def test_whitespace_normalized(self):
        """Deve ignorar espaços extras"""
        text1 = "Cards confusos"
        text2 = "  Cards   confusos  "
        similarity = TextSimilarityService.calculate_similarity(text1, text2)
        # Deve ser muito próximo de 1.0 (normalizando espaços)
        self.assertGreater(similarity, 0.9)

    def test_similar_texts(self):
        """Textos similares devem ter alta similaridade"""
        text1 = "Reuniões muito longas"
        text2 = "Reuniões longas demais"
        similarity = TextSimilarityService.calculate_similarity(text1, text2)
        self.assertGreater(similarity, 0.65)  # Alta similaridade

    def test_different_texts(self):
        """Textos diferentes devem ter baixa similaridade"""
        text1 = "Cards confusos"
        text2 = "Deploy automatizado"
        similarity = TextSimilarityService.calculate_similarity(text1, text2)
        self.assertLess(similarity, 0.5)  # Baixa similaridade

    def test_empty_strings(self):
        """Strings vazias devem retornar 1.0"""
        similarity = TextSimilarityService.calculate_similarity("", "")
        self.assertEqual(similarity, 1.0)

    def test_one_empty_string(self):
        """Uma string vazia vs não vazia deve retornar 0.0"""
        similarity = TextSimilarityService.calculate_similarity("texto", "")
        self.assertEqual(similarity, 0.0)

    def test_are_similar_threshold_high(self):
        """are_similar deve respeitar threshold alto"""
        text1 = "Cards muito confusos"
        text2 = "Cards confusos"

        # Com threshold muito alto (0.95), não deve considerar similar
        self.assertFalse(
            TextSimilarityService.are_similar(text1, text2, threshold=0.95)
        )

    def test_are_similar_threshold_low(self):
        """are_similar deve respeitar threshold baixo"""
        text1 = "Cards muito confusos"
        text2 = "Cards confusos"

        # Com threshold baixo (0.80), deve considerar similar
        self.assertTrue(TextSimilarityService.are_similar(text1, text2, threshold=0.80))

    def test_find_similar_items_empty_list(self):
        """find_similar_items com lista vazia"""
        items = []
        result = TextSimilarityService.find_similar_items("teste", items)
        self.assertEqual(result, [])

    def test_find_similar_items_single_match(self):
        """find_similar_items encontra um item similar"""
        items = [
            {"id": 1, "conteudo": "Cards confusos"},
            {"id": 2, "conteudo": "Deploy automatizado"},
        ]

        result = TextSimilarityService.find_similar_items(
            "cards confusos", items, threshold=0.85
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], 1)
        self.assertIn("similarity", result[0])
        self.assertGreater(result[0]["similarity"], 0.85)

    def test_find_similar_items_multiple_matches(self):
        """find_similar_items encontra múltiplos items"""
        items = [
            {"id": 1, "conteudo": "Reuniões muito longas"},
            {"id": 2, "conteudo": "Reuniões longas demais"},
            {"id": 3, "conteudo": "Deploy rápido"},
        ]

        result = TextSimilarityService.find_similar_items(
            "reuniões longas", items, threshold=0.70
        )

        self.assertGreaterEqual(len(result), 2)
        # Deve estar ordenado por similaridade decrescente
        self.assertGreaterEqual(result[0]["similarity"], result[1]["similarity"])

    def test_find_similar_items_ordered_by_similarity(self):
        """find_similar_items retorna ordenado por similaridade"""
        items = [
            {"id": 1, "conteudo": "Cards"},  # 100% similar
            {"id": 2, "conteudo": "Cards confusos muito"},  # ~80%
            {"id": 3, "conteudo": "Deploy"},  # ~0%
        ]

        result = TextSimilarityService.find_similar_items(
            "Cards confusos", items, threshold=0.0
        )

        # Deve estar ordenado por similaridade
        self.assertGreaterEqual(result[0]["similarity"], result[1]["similarity"])


class ActionItemsTrackerTestCase(TestCase):
    """Testes para ActionItemsTracker."""

    def setUp(self):
        """Setup: criar 2 retrospectivas com action items"""
        self.template = RetroTemplate.objects.create(
            nome="Default",
            categorias=[
                {"slug": "action_items", "name": "Action Items", "icon": "✅"},
                {"slug": "went_well", "name": "What Went Well", "icon": "😊"},
            ],
        )

        self.autor = User.objects.create_user(username="teste", password="123")

        self.retro1 = Retro.objects.create(
            titulo="Retro 1",
            data=timezone.now(),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

        self.retro2 = Retro.objects.create(
            titulo="Retro 2",
            data=timezone.now() + timedelta(days=14),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

    def test_analyze_less_than_2_retros(self):
        """analyze com < 2 retros retorna estrutura vazia"""
        result = ActionItemsTracker.analyze([1])

        self.assertEqual(result["total_action_items_anterior"], 0)
        self.assertEqual(result["resolvidos"], 0)
        self.assertEqual(result["recorrentes"], 0)
        self.assertEqual(result["novos"], 0)
        self.assertEqual(result["taxa_resolucao"], 0.0)

    def test_analyze_action_items_resolved(self):
        """Action items que desaparecem são marcados como resolvidos"""
        # Criar action item na retro 1
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="action_items",
            conteudo="Implementar CI/CD",
            autor=self.autor,
        )

        result = ActionItemsTracker.analyze([self.retro1.id, self.retro2.id])

        self.assertEqual(result["total_action_items_anterior"], 1)
        self.assertEqual(result["resolvidos"], 1)
        self.assertEqual(result["taxa_resolucao"], 100.0)

    def test_analyze_action_items_recurrent(self):
        """Action items que continuam aparecem como recorrentes"""
        # Criar action item na retro 1
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="action_items",
            conteudo="Melhorar documentação",
            autor=self.autor,
        )

        # Criar similar na retro 2
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="action_items",
            conteudo="Melhorar a documentação",  # Pequena variação
            autor=self.autor,
        )

        result = ActionItemsTracker.analyze([self.retro1.id, self.retro2.id])

        self.assertEqual(result["total_action_items_anterior"], 1)
        self.assertEqual(result["recorrentes"], 1)
        self.assertEqual(result["taxa_resolucao"], 0.0)

    def test_analyze_action_items_new(self):
        """Action items novos na retro 2 aparecem como novos"""
        # Criar action item na retro 2 (não existia na 1)
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="action_items",
            conteudo="Novo processo de deploy",
            autor=self.autor,
        )

        result = ActionItemsTracker.analyze([self.retro1.id, self.retro2.id])

        self.assertEqual(result["total_action_items_anterior"], 0)
        self.assertEqual(result["novos"], 1)

    def test_analyze_mixed_statuses(self):
        """Test com mix de resolvidos, recorrentes e novos"""
        # Resolvido: só na retro 1
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="action_items",
            conteudo="Implementar CI/CD",
            autor=self.autor,
        )

        # Recorrente: em ambas (com pequena variação)
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="action_items",
            conteudo="Melhorar performance",
            autor=self.autor,
        )
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="action_items",
            conteudo="Melhorar a performance",
            autor=self.autor,
        )

        # Novo: só na retro 2
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="action_items",
            conteudo="Refatorar código",
            autor=self.autor,
        )

        result = ActionItemsTracker.analyze([self.retro1.id, self.retro2.id])

        self.assertEqual(result["total_action_items_anterior"], 2)
        self.assertEqual(result["resolvidos"], 1)
        self.assertEqual(result["recorrentes"], 1)
        self.assertEqual(result["novos"], 1)
        self.assertEqual(result["taxa_resolucao"], 50.0)


class RecurrenceAnalyzerTestCase(TestCase):
    """Testes para RecurrenceAnalyzer."""

    def setUp(self):
        """Setup: criar 3 retrospectivas com items"""
        self.template = RetroTemplate.objects.create(
            nome="Default",
            categorias=[
                {"slug": "to_improve", "name": "To Improve", "icon": "📝"},
                {"slug": "went_well", "name": "What Went Well", "icon": "😊"},
                {"slug": "action_items", "name": "Action Items", "icon": "✅"},
            ],
        )

        self.autor = User.objects.create_user(username="teste", password="123")

        self.retro1 = Retro.objects.create(
            titulo="Retro 1",
            data=timezone.now(),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

        self.retro2 = Retro.objects.create(
            titulo="Retro 2",
            data=timezone.now() + timedelta(days=14),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

        self.retro3 = Retro.objects.create(
            titulo="Retro 3",
            data=timezone.now() + timedelta(days=28),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

    def test_analyze_no_items(self):
        """analyze sem items retorna estrutura vazia"""
        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 0)
        self.assertEqual(result["itens_recorrentes"], [])

    def test_analyze_single_occurrence(self):
        """Items que aparecem em apenas 1 retro não são recorrentes"""
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="to_improve",
            conteudo="Reuniões longas",
            autor=self.autor,
        )

        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 0)

    def test_analyze_recurrent_item(self):
        """Items similares em múltiplas retros são detectados"""
        # Mesmo item em 2 retros (textos identicos/quase identicos para passar threshold 0.85)
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="to_improve",
            conteudo="Reuniões muito longas e improdutivas demais",
            autor=self.autor,
        )

        RetroItem.objects.create(
            retro=self.retro2,
            categoria="to_improve",
            conteudo="Reuniões muito longas e improdutivas",
            autor=self.autor,
        )

        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 1)
        self.assertEqual(len(result["itens_recorrentes"]), 1)
        self.assertEqual(result["itens_recorrentes"][0]["frequencia"], 2)
        self.assertEqual(result["por_categoria"]["to_improve"], 1)

    def test_analyze_multiple_recurrences(self):
        """Múltiplas recorrências em categorias diferentes"""
        # Recorrência 1: to_improve em retro1 e retro2 (textos identicos/quase identicos)
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="to_improve",
            conteudo="Reuniões muito longas e improdutivas demais",
            autor=self.autor,
        )
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="to_improve",
            conteudo="Reuniões muito longas e improdutivas",
            autor=self.autor,
        )

        # Recorrência 2: went_well em retro2 e retro3 (textos identicos/quase identicos)
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="went_well",
            conteudo="Pair programming foi muito efetivo",
            autor=self.autor,
        )
        RetroItem.objects.create(
            retro=self.retro3,
            categoria="went_well",
            conteudo="Pair programming foi efetivo",
            autor=self.autor,
        )

        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 2)
        self.assertEqual(result["por_categoria"]["to_improve"], 1)
        self.assertEqual(result["por_categoria"]["went_well"], 1)

    def test_analyze_excludes_action_items(self):
        """Action items não aparecem na análise de recorrência"""
        # Action items (devem ser ignorados)
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="action_items",
            conteudo="Implementar feature X",
            autor=self.autor,
        )
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="action_items",
            conteudo="Implementar feature X",
            autor=self.autor,
        )

        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 0)

    def test_analyze_similarity_threshold(self):
        """Items com similaridade < 85% não são considerados recorrentes"""
        # Muito diferentes (< 85% similaridade)
        RetroItem.objects.create(
            retro=self.retro1,
            categoria="to_improve",
            conteudo="Reuniões longas",
            autor=self.autor,
        )
        RetroItem.objects.create(
            retro=self.retro2,
            categoria="to_improve",
            conteudo="Deploy automatizado",  # Completamente diferente
            autor=self.autor,
        )

        result = RecurrenceAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["total_recorrencias"], 0)


class TendencyAnalyzerTestCase(TestCase):
    """Testes para TendencyAnalyzer."""

    def setUp(self):
        """Setup: criar 3 retrospectivas com items para análise de tendência"""
        self.template = RetroTemplate.objects.create(
            nome="Default",
            categorias=[
                {"slug": "went_well", "name": "What Went Well", "icon": "😊"},
                {"slug": "to_improve", "name": "To Improve", "icon": "📝"},
                {"slug": "stop", "name": "Stop", "icon": "🛑"},
            ],
        )

        self.autor = User.objects.create_user(username="teste", password="123")

        self.retro1 = Retro.objects.create(
            titulo="Retro 1",
            data=timezone.now(),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

        self.retro2 = Retro.objects.create(
            titulo="Retro 2",
            data=timezone.now() + timedelta(days=14),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

        self.retro3 = Retro.objects.create(
            titulo="Retro 3",
            data=timezone.now() + timedelta(days=28),
            template=self.template,
            autor=self.autor,
            status="concluida",
        )

    def test_analyze_no_items(self):
        """analyze sem items retorna estrutura com 0s"""
        result = TendencyAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertIn("went_well", result)
        self.assertEqual(result["went_well"]["valores"], [0, 0, 0])
        self.assertEqual(result["went_well"]["tendencia"], "insuficiente")

    def test_analyze_crescente(self):
        """Tendência crescente quando aumenta > 10%"""
        # Went well: 10 → 12 → 14 (crescimento)
        for i in range(10):
            RetroItem.objects.create(
                retro=self.retro1,
                categoria="went_well",
                conteudo=f"Item {i}",
                autor=self.autor,
            )

        for i in range(12):
            RetroItem.objects.create(
                retro=self.retro2,
                categoria="went_well",
                conteudo=f"Item {i}",
                autor=self.autor,
            )

        for i in range(14):
            RetroItem.objects.create(
                retro=self.retro3,
                categoria="went_well",
                conteudo=f"Item {i}",
                autor=self.autor,
            )

        result = TendencyAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["went_well"]["valores"], [10, 12, 14])
        self.assertEqual(result["went_well"]["tendencia"], "crescente")
        self.assertEqual(result["went_well"]["variacao_percentual"], 40.0)

    def test_analyze_decrescente(self):
        """Tendência decrescente quando diminui < -10%"""
        # To improve: 20 → 18 → 15 (decrescimento)
        for i in range(20):
            RetroItem.objects.create(
                retro=self.retro1,
                categoria="to_improve",
                conteudo=f"Issue {i}",
                autor=self.autor,
            )

        for i in range(18):
            RetroItem.objects.create(
                retro=self.retro2,
                categoria="to_improve",
                conteudo=f"Issue {i}",
                autor=self.autor,
            )

        for i in range(15):
            RetroItem.objects.create(
                retro=self.retro3,
                categoria="to_improve",
                conteudo=f"Issue {i}",
                autor=self.autor,
            )

        result = TendencyAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["to_improve"]["valores"], [20, 18, 15])
        self.assertEqual(result["to_improve"]["tendencia"], "decrescente")
        self.assertEqual(result["to_improve"]["variacao_percentual"], -25.0)

    def test_analyze_estavel(self):
        """Tendência estável quando varia entre -10% e +10%"""
        # Stop: 10 → 10 → 11 (variação < 10%)
        for i in range(10):
            RetroItem.objects.create(
                retro=self.retro1,
                categoria="stop",
                conteudo=f"Problem {i}",
                autor=self.autor,
            )

        for i in range(10):
            RetroItem.objects.create(
                retro=self.retro2,
                categoria="stop",
                conteudo=f"Problem {i}",
                autor=self.autor,
            )

        for i in range(11):
            RetroItem.objects.create(
                retro=self.retro3,
                categoria="stop",
                conteudo=f"Problem {i}",
                autor=self.autor,
            )

        result = TendencyAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertEqual(result["stop"]["valores"], [10, 10, 11])
        self.assertEqual(result["stop"]["tendencia"], "estável")
        self.assertEqual(result["stop"]["variacao_percentual"], 10.0)

    def test_analyze_insufficient_data(self):
        """Tendência insuficiente com < 2 retros"""
        result = TendencyAnalyzer.analyze([self.retro1.id])

        self.assertEqual(result["went_well"]["tendencia"], "insuficiente")
        self.assertEqual(result["went_well"]["variacao_percentual"], 0.0)

    def test_analyze_returns_all_categories(self):
        """Resultado contém todas as categorias do template"""
        result = TendencyAnalyzer.analyze(
            [self.retro1.id, self.retro2.id, self.retro3.id]
        )

        self.assertIn("went_well", result)
        self.assertIn("to_improve", result)
        self.assertIn("stop", result)

        for categoria_slug in ["went_well", "to_improve", "stop"]:
            self.assertIn("tendencia", result[categoria_slug])
            self.assertIn("variacao_percentual", result[categoria_slug])
            self.assertIn("valores", result[categoria_slug])
            self.assertEqual(len(result[categoria_slug]["valores"]), 3)
