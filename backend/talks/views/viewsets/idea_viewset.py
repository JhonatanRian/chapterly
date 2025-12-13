from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from core.decorators import require_feature
from talks.filters import IdeaFilter
from talks.models import Idea, Vote
from talks.notifications.signals import (
    idea_rescheduled,
    idea_voted,
    volunteer_registered,
)
from talks.permissions import IsPresenterOrOwnerOrAdmin
from talks.serializers import (
    IdeaCreateUpdateSerializer,
    IdeaDetailSerializer,
    IdeaListSerializer,
    RescheduleSerializer,
)


@extend_schema(tags=["ideas"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar ideias",
        description="Lista todas as ideias com paginação e filtros avançados",
    ),
    create=extend_schema(
        summary="Criar ideia",
        description="Cria uma nova ideia de apresentação",
    ),
    retrieve=extend_schema(
        summary="Detalhes da ideia",
        description="Retorna detalhes completos de uma ideia",
    ),
    update=extend_schema(
        summary="Atualizar ideia",
        description="Atualiza completamente uma ideia (apenas autor)",
    ),
    partial_update=extend_schema(
        summary="Atualizar parcialmente",
        description="Atualiza parcialmente uma ideia (apenas autor)",
    ),
    destroy=extend_schema(
        summary="Deletar ideia",
        description="Deleta uma ideia (apenas autor)",
    ),
)
class IdeaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsPresenterOrOwnerOrAdmin]
    filterset_class = IdeaFilter
    search_fields = ["titulo", "descricao", "conteudo"]
    ordering_fields = ["created_at", "data_agendada", "total_votes"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Idea.objects.with_vote_stats().annotate(
            total_votes=Count("votos", filter=Q(votos__user__is_active=True))
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return IdeaDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return IdeaCreateUpdateSerializer
        return IdeaListSerializer

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    @extend_schema(
        summary="Verificar permissões",
        description="Retorna as permissões do usuário atual para editar e deletar a ideia",
        request=None,
        responses={
            200: {
                "description": "Permissões do usuário",
                "examples": {
                    "application/json": {
                        "editable": True,
                        "deletable": True,
                        "reschedulable": True,
                    }
                },
            }
        },
    )
    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def permissions(self, request, pk=None):
        idea = self.get_object()
        user = request.user

        is_admin = user.is_staff or user.is_superuser

        is_creator = idea.autor == user

        is_presenter = idea.apresentador == user

        editable = is_creator or is_presenter or is_admin

        deletable = is_creator or is_admin

        reschedulable = is_creator or is_presenter or is_admin

        return Response(
            {
                "editable": editable,
                "deletable": deletable,
                "reschedulable": reschedulable,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Votar em ideia",
        description="Toggle voto: adiciona se não votou, remove se já votou",
        request=None,
        responses={
            200: {"description": "Voto removido"},
            201: {"description": "Voto adicionado"},
        },
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    @require_feature("chapter_enabled")
    def vote(self, request, pk=None):
        idea = self.get_object()
        user = request.user

        vote, created = Vote.objects.get_or_create(user=user, idea=idea)

        if not created:
            vote.delete()
            return Response(
                {"detail": "Voto removido com sucesso.", "voted": False},
                status=status.HTTP_200_OK,
            )
        else:
            idea_voted.send(sender=self.__class__, idea=idea, user=user, voted=True)

            return Response(
                {"detail": "Voto registrado com sucesso.", "voted": True},
                status=status.HTTP_201_CREATED,
            )

    @extend_schema(
        summary="Voluntariar-se",
        description="Inscreve-se para apresentar a ideia",
        request=None,
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    @require_feature("chapter_enabled")
    def volunteer(self, request, pk=None):
        idea = self.get_object()
        user = request.user

        if idea.apresentador is not None:
            return Response(
                {"detail": "Esta ideia já tem um apresentador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        idea.apresentador = user
        idea.save()

        volunteer_registered.send(sender=self.__class__, idea=idea, user=user)

        return Response(
            {"detail": "Você se inscreveu como apresentador!"},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Remover apresentador",
        description="Remove-se como apresentador (ou remove outro se for admin/autor)",
    )
    @action(detail=True, methods=["delete"], permission_classes=[IsAuthenticated])
    @require_feature("chapter_enabled")
    def unvolunteer(self, request, pk=None):
        idea = self.get_object()
        user = request.user

        if not (
            idea.apresentador == user
            or idea.autor == user
            or user.is_staff
            or user.is_superuser
        ):
            return Response(
                {"detail": "Você não tem permissão para remover o apresentador."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if idea.apresentador is None:
            return Response(
                {"detail": "Esta ideia não tem apresentador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        idea.apresentador = None
        idea.save()

        return Response(
            {"detail": "Apresentador removido com sucesso."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Próximas apresentações",
        description="Retorna as próximas 5 apresentações agendadas",
        responses={200: IdeaListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        upcoming_ideas = (
            Idea.objects.with_vote_stats()
            .filter(data_agendada__gte=timezone.now())
            .order_by("data_agendada")[:5]
        )

        serializer = IdeaListSerializer(
            upcoming_ideas, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Timeline de apresentações",
        description="Retorna todas as apresentações agendadas, ordenadas por data. Suporta filtro por status (pendente, agendado, concluido)",
        responses={200: IdeaListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def timeline(self, request):
        timeline_ideas = (
            Idea.objects.with_vote_stats()
            .filter(data_agendada__isnull=False)
            .order_by("data_agendada")
        )

        status_filter = request.query_params.get("status")
        if status_filter:
            now = timezone.now()
            if status_filter == "agendado":
                timeline_ideas = timeline_ideas.filter(data_agendada__gt=now)
            elif status_filter == "concluido":
                timeline_ideas = timeline_ideas.filter(data_agendada__lte=now)

        page = self.paginate_queryset(timeline_ideas)
        if page is not None:
            serializer = IdeaListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = IdeaListSerializer(
            timeline_ideas, many=True, context={"request": request}
        )
        return Response({"results": serializer.data, "count": len(serializer.data)})

    @extend_schema(
        summary="Reagendar apresentação",
        description="Atualiza a data/hora agendada da apresentação",
        request=RescheduleSerializer,
        responses={200: IdeaDetailSerializer},
    )
    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAuthenticated, IsPresenterOrOwnerOrAdmin],
    )
    @require_feature("chapter_enabled")
    def reschedule(self, request, pk=None):
        idea = self.get_object()

        serializer = RescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_date = idea.data_agendada
        idea.data_agendada = serializer.validated_data["data_agendada"]
        idea.save()

        idea_rescheduled.send(
            sender=self.__class__,
            idea=idea,
            user=request.user,
            old_date=old_date,
            new_date=idea.data_agendada,
        )

        serializer = IdeaDetailSerializer(idea, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        summary="Estatísticas gerais",
        description="Retorna estatísticas gerais do sistema de ideias",
    )
    @action(detail=False, methods=["get"])
    def stats(self, request):
        today = timezone.now()
        total_ideias = Idea.objects.count()
        pendentes = Idea.objects.filter(data_agendada__isnull=True).count()
        agendadas = Idea.objects.filter(data_agendada__gt=today).count()
        concluidas = Idea.objects.filter(data_agendada__lte=today).count()
        precisa_apresentador = Idea.objects.filter(apresentador__isnull=True).count()
        total_votos = Vote.objects.count()

        stats = {
            "total_ideias": total_ideias,
            "pendentes": pendentes,
            "agendadas": agendadas,
            "concluidas": concluidas,
            "precisa_apresentador": precisa_apresentador,
            "total_votos": total_votos,
        }

        return Response(stats)
