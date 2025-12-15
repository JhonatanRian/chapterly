from core.decorators import require_feature
from django.db.models import Avg, Count, Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from talks.models import Retro, RetroItem
from talks.permissions import IsOwnerOrReadOnly, IsStaffOrAdmin
from talks.serializers import (
    RetroCreateUpdateSerializer,
    RetroDetailSerializer,
    RetroItemCreateSerializer,
    RetroItemSerializer,
    RetroListSerializer,
)


class RetroViewSet(viewsets.ModelViewSet):
    def get_permissions(self) -> list:
        if self.action in ["join", "leave", "add_item", "vote_item"]:
            return [IsAuthenticated()]
        if self.action in ["create"]:
            return [IsAuthenticated(), IsStaffOrAdmin()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        queryset = Retro.objects.select_related("autor", "template").prefetch_related(
            "participantes",
            Prefetch(
                "items",
                queryset=RetroItem.objects.select_related("autor")
                .prefetch_related("votes")
                .order_by("ordem", "id"),
            ),
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        autor_id = self.request.query_params.get("autor")
        if autor_id:
            queryset = queryset.filter(autor_id=autor_id)

        participante_id = self.request.query_params.get("participante")
        if participante_id:
            queryset = queryset.filter(participantes__id=participante_id)

        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return RetroListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return RetroCreateUpdateSerializer
        return RetroDetailSerializer

    @require_feature("retro_enabled")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        retro = serializer.save(autor=request.user)

        retro.participantes.add(request.user)

        detail_serializer = RetroDetailSerializer(retro, context={"request": request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    @require_feature("retro_enabled")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @require_feature("retro_enabled")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @require_feature("retro_enabled")
    def add_item(self, request, pk=None):
        retro = self.get_object()

        is_admin_or_author = request.user.is_staff or retro.autor == request.user

        if not is_admin_or_author and retro.status != "em_andamento":
            return Response(
                {
                    "detail": "Itens só podem ser adicionados durante retrospectivas em andamento."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not retro.participantes.filter(id=request.user.id).exists():
            return Response(
                {"detail": "Você precisa ser participante para adicionar itens."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RetroItemCreateSerializer(
            data=request.data, context={"request": request, "retro": retro}
        )
        serializer.is_valid(raise_exception=True)

        item = serializer.save(retro=retro, autor=request.user)

        response_serializer = RetroItemSerializer(item, context={"request": request})

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="items/(?P<item_id>[^/.]+)/vote")
    @require_feature("retro_enabled")
    def vote_item(self, request, pk=None, item_id=None):
        retro = self.get_object()

        try:
            item = retro.items.get(id=item_id)
        except RetroItem.DoesNotExist:
            return Response(
                {"detail": "Item não encontrado nesta retrospectiva."},
                status=status.HTTP_404_NOT_FOUND,
            )

        voted = item.toggle_vote(request.user)

        return Response({"voted": voted, "vote_count": item.vote_count})

    @action(detail=True, methods=["post"])
    @require_feature("retro_enabled")
    def join(self, request, pk=None):
        retro = self.get_object()

        if retro.status == "concluida":
            return Response(
                {"detail": "Não é possível participar de uma retrospectiva concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if retro.participantes.filter(id=request.user.id).exists():
            return Response(
                {"detail": "Você já é participante desta retrospectiva."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        retro.participantes.add(request.user)

        return Response(
            {
                "detail": "Você foi adicionado como participante.",
                "total_participantes": retro.total_participantes,
            }
        )

    @action(detail=True, methods=["post"])
    @require_feature("retro_enabled")
    def leave(self, request, pk=None):
        retro = self.get_object()

        if retro.status == "concluida":
            return Response(
                {"detail": "Não é possível sair de uma retrospectiva concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not retro.participantes.filter(id=request.user.id).exists():
            return Response(
                {"detail": "Você não é participante desta retrospectiva."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if retro.autor == request.user:
            return Response(
                {"detail": "O autor não pode sair da retrospectiva."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        retro.participantes.remove(request.user)

        return Response(
            {
                "detail": "Você foi removido como participante.",
                "total_participantes": retro.total_participantes,
            }
        )

    def _calculate_engagement_analysis(self, queryset):
        """
        Calcula análise de engajamento do time.
        """
        # Média de itens por pessoa
        total_autores_unicos = (
            RetroItem.objects.filter(retro__in=queryset)
            .values("autor")
            .distinct()
            .count()
        )

        total_itens = RetroItem.objects.filter(retro__in=queryset).count()
        media_itens_por_pessoa = (
            total_itens / total_autores_unicos if total_autores_unicos > 0 else 0
        )

        # Participantes por retro
        retros_com_participantes = queryset.prefetch_related("participantes")
        participantes_por_retro = {
            retro.id: retro.participantes.count() for retro in retros_com_participantes
        }

        # Trend de participação (últimas 5 vs 5 anteriores)
        retros_ordenadas = queryset.order_by("-data")
        retros_ordenadas_count = retros_ordenadas.count()
        ultimas_5 = list(retros_ordenadas[:5])
        anteriores_5 = list(retros_ordenadas[5:10])

        if ultimas_5 and anteriores_5:
            media_ultimas = (
                sum([r.participantes.count() for r in ultimas_5]) / 5
                if ultimas_5
                else 0
            )
            media_anteriores = (
                sum([r.participantes.count() for r in anteriores_5]) / 5
                if anteriores_5
                else 0
            )

            # Determinar trend (com threshold de 10% para evitar variação normal)
            if media_ultimas > media_anteriores * 1.1:
                trend = "crescente"
            elif media_ultimas < media_anteriores * 0.9:
                trend = "decrescente"
            else:
                trend = "estável"
        else:
            media = (
                sum([r.participantes.count() for r in retros_ordenadas])
                / retros_ordenadas.count()
                if anteriores_5
                else 0
            )
            if media > retros_ordenadas_count / 2:
                trend = "crescente"
            elif media < retros_ordenadas_count / 2:
                trend = "decrescente"
            else:
                trend = "estável"

        return {
            "media_itens_por_pessoa": round(media_itens_por_pessoa, 1),
            "participantes_por_retro": participantes_por_retro,
            "trend_participacao": trend,
        }

    def _calculate_pattern_analysis(self, queryset, request):
        """
        Calcula análise de padrões nas retrospectivas.
        """
        itens_por_categoria = dict(
            RetroItem.objects.filter(retro__in=queryset)
            .values("categoria")
            .annotate(total=Count("id"))
            .values_list("categoria", "total")
        )

        # Top 10 itens mais votados (convert to list to fix serialization)
        top_itens_votados = list(
            RetroItem.objects.annotate(num_votes=Count("votes"))
            .filter(retro__in=queryset)
            .order_by("-num_votes")[:10]
            .prefetch_related("votes")
            .select_related("autor", "retro")
        )

        return {
            "itens_por_categoria": itens_por_categoria,
            "top_itens_votados": top_itens_votados,
        }

    @action(detail=False, methods=["get"])
    @permission_classes([IsAuthenticated, IsStaffOrAdmin])
    @require_feature("retro_enabled")
    def metrics(self, request):
        """
        Retorna análise completa com:
        - Métricas gerais (totais, médias, distribuição por status)
        - Análise de engajamento (participação, trend)
        - Análise de padrões (categorias, top itens)
        """
        from talks.serializers.retro_metrics_serializer import (
            GlobalMetricsResponseSerializer,
        )

        queryset = self.get_queryset()

        # ===== MÉTRICAS GERAIS (TASK 3) =====
        total_retros = queryset.count()
        total_concluidas = queryset.filter(status="concluida").count()
        taxa_conclusao = (
            (total_concluidas / total_retros * 100) if total_retros > 0 else 0
        )

        retros_stats = queryset.aggregate(
            total_items=Count("items", distinct=True),
            total_votos=Count("items__votes", distinct=True),
            media_items=Avg("items__id"),
            media_participantes=Avg("participantes__id"),
        )

        retros_por_status = dict(
            queryset.values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        # Get recent retros - convert to list to avoid queryset serialization
        retros_recentes = list(queryset.select_related("autor").order_by("-data")[:5])

        metricas_gerais = {
            "total_retros": total_retros,
            "total_items": retros_stats["total_items"] or 0,
            "total_votos": retros_stats["total_votos"] or 0,
            "media_items_por_retro": round(retros_stats["media_items"] or 0, 1),
            "media_participantes_por_retro": round(
                retros_stats["media_participantes"] or 0, 1
            ),
            "taxa_conclusao": round(taxa_conclusao, 2),
            "retros_por_status": retros_por_status,
            "retros_recentes": retros_recentes,
        }

        # ===== ANÁLISE DE ENGAJAMENTO (TASK 4) =====
        analise_engajamento = self._calculate_engagement_analysis(queryset)

        # ===== ANÁLISE DE PADRÕES (TASK 5) =====
        analise_padroes = self._calculate_pattern_analysis(queryset, request)

        response_data = {
            "metricas_gerais": metricas_gerais,
            "analise_engajamento": analise_engajamento,
            "analise_padroes": analise_padroes,
        }

        serializer = GlobalMetricsResponseSerializer(
            response_data, context={"request": request}
        )
        return Response(serializer.data)
