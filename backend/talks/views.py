from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .filters import IdeaFilter
from .models import Comment, Idea, Notification, Tag, Vote
from .permissions import IsOwnerOrReadOnly, IsPresenterOrOwnerOrAdmin
from .serializers import (
    CommentSerializer,
    IdeaCreateUpdateSerializer,
    IdeaDetailSerializer,
    IdeaListSerializer,
    NotificationSerializer,
    RescheduleSerializer,
    TagSerializer,
)


@extend_schema(tags=["upload"])
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """
    Upload de imagem para uso no editor de rich text.

    Aceita uma imagem e retorna a URL pública.
    Usado pelo editor Tiptap para inserir imagens no conteúdo.
    """
    if "image" not in request.FILES:
        return Response(
            {"error": "Nenhuma imagem foi enviada"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    image = request.FILES["image"]

    # Validar tipo de arquivo
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        return Response(
            {"error": "Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validar tamanho (máx 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if image.size > max_size:
        return Response(
            {"error": "Imagem muito grande. Tamanho máximo: 5MB"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Salvar arquivo
    file_path = f"ideas/content/{image.name}"
    saved_path = default_storage.save(file_path, image)
    file_url = request.build_absolute_uri(default_storage.url(saved_path))

    return Response(
        {
            "url": file_url,
            "name": image.name,
            "size": image.size,
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(tags=["tags"])
class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para tags (apenas leitura)
    list: Listar todas as tags
    retrieve: Detalhes de uma tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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
    """
    ViewSet completo para ideias
    list: Listar ideias com filtros
    create: Criar nova ideia
    retrieve: Detalhes de uma ideia
    update: Atualizar ideia (full)
    partial_update: Atualizar ideia (parcial)
    destroy: Deletar ideia
    """

    permission_classes = [IsAuthenticatedOrReadOnly, IsPresenterOrOwnerOrAdmin]
    filterset_class = IdeaFilter
    search_fields = ["titulo", "descricao", "conteudo"]
    ordering_fields = ["created_at", "data_agendada", "total_votes"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Otimiza queries com anotações de votos pré-calculadas.
        Usa manager customizado com select_related, prefetch_related e vote_stats.
        """
        return Idea.objects.with_vote_stats().annotate(
            total_votes=Count("votos", filter=Q(votos__user__is_active=True))
        )

    def get_serializer_class(self):
        """
        Retorna serializer apropriado baseado na action
        """
        if self.action == "retrieve":
            return IdeaDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return IdeaCreateUpdateSerializer
        return IdeaListSerializer

    def perform_create(self, serializer):
        """
        Salva o autor como usuário autenticado
        """
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
        """
        GET /ideas/{id}/permissions/
        Retorna as permissões do usuário para editar, deletar e reagendar a ideia

        Regras:
        - Editar: Criador OR Apresentador OR Admin
        - Deletar: Criador OR Admin
        - Reagendar: Criador OR Apresentador OR Admin
        """
        idea = self.get_object()
        user = request.user

        # Admin/superuser tem todas as permissões
        is_admin = user.is_staff or user.is_superuser

        # Verificar se é criador
        is_creator = idea.autor == user

        # Verificar se é apresentador
        is_presenter = idea.apresentador == user

        # Editar: Criador OR Apresentador OR Admin
        editable = is_creator or is_presenter or is_admin

        # Deletar: Criador OR Admin (não apresentador)
        deletable = is_creator or is_admin

        # Reagendar: Criador OR Apresentador OR Admin
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
    def vote(self, request, pk=None):
        """
        POST /ideas/{id}/vote/
        Toggle voto: se já votou, remove; se não votou, adiciona
        """
        idea = self.get_object()
        user = request.user

        vote, created = Vote.objects.get_or_create(user=user, idea=idea)

        if not created:
            # Já tinha votado, então remove o voto
            vote.delete()
            return Response(
                {"detail": "Voto removido com sucesso.", "voted": False},
                status=status.HTTP_200_OK,
            )
        else:
            # Voto adicionado
            # Criar notificação para o autor (se não for ele mesmo)
            if idea.autor != user:
                Notification.objects.create(
                    user=idea.autor,
                    tipo="voto",
                    mensagem=f"{user.username} votou na sua ideia '{idea.titulo}'",
                    idea=idea,
                )

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
    def volunteer(self, request, pk=None):
        """
        POST /ideas/{id}/volunteer/
        Voluntariar-se como apresentador
        """
        idea = self.get_object()
        user = request.user

        # Verificar se já tem apresentador
        if idea.apresentador is not None:
            return Response(
                {"detail": "Esta ideia já tem um apresentador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Definir usuário como apresentador
        idea.apresentador = user
        idea.save()

        # Criar notificação para o autor
        if idea.autor != user:
            Notification.objects.create(
                user=idea.autor,
                tipo="voluntario",
                mensagem=f"{user.username} se voluntariou para apresentar '{idea.titulo}'",
                idea=idea,
            )

        return Response(
            {"detail": "Você se inscreveu como apresentador!"},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Remover apresentador",
        description="Remove-se como apresentador (ou remove outro se for admin/autor)",
    )
    @action(detail=True, methods=["delete"], permission_classes=[IsAuthenticated])
    def unvolunteer(self, request, pk=None):
        """
        DELETE /ideas/{id}/unvolunteer/
        Remover-se como apresentador (ou remover outro se for admin/autor)
        """
        idea = self.get_object()
        user = request.user

        # Verificar permissão
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
        """
        GET /ideas/upcoming/
        Retorna as próximas 5 apresentações agendadas
        """
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
        """
        GET /ideas/timeline/?status=agendado
        Retorna todas as apresentações agendadas, ordenadas por data

        Query params:
        - status: filtrar por status (pendente, agendado, concluido)
        """
        timeline_ideas = (
            Idea.objects.with_vote_stats()
            .filter(data_agendada__isnull=False)
            .order_by("data_agendada")
        )

        # Filtro server-side por status
        status_filter = request.query_params.get("status")
        if status_filter:
            now = timezone.now()
            if status_filter == "agendado":
                # data_agendada > now
                timeline_ideas = timeline_ideas.filter(data_agendada__gt=now)
            elif status_filter == "concluido":
                # data_agendada <= now
                timeline_ideas = timeline_ideas.filter(data_agendada__lte=now)

        # Paginar resultados
        page = self.paginate_queryset(timeline_ideas)
        if page is not None:
            serializer = IdeaListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        # Fallback se paginação não estiver configurada
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
    def reschedule(self, request, pk=None):
        """
        PATCH /ideas/{id}/reschedule/
        Reagenda uma apresentação (atualiza data_agendada)
        Apenas autor, apresentador ou admin podem reagendar
        """
        idea = self.get_object()

        # Validar dados com serializer
        serializer = RescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Atualizar data agendada (já vem validada e como datetime)
        idea.data_agendada = serializer.validated_data["data_agendada"]
        idea.save()

        # Criar notificação para autor e apresentador (se diferentes do usuário)
        notified_users = set()
        if idea.autor != request.user:
            notified_users.add(idea.autor)
        if idea.apresentador and idea.apresentador != request.user:
            notified_users.add(idea.apresentador)

        for user in notified_users:
            Notification.objects.create(
                user=user,
                tipo="agendamento",
                mensagem=f"{request.user.username} reagendou '{idea.titulo}'",
                idea=idea,
            )

        serializer = IdeaDetailSerializer(idea, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        summary="Estatísticas gerais",
        description="Retorna estatísticas gerais do sistema de ideias",
    )
    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        GET /ideas/stats/
        Retorna estatísticas gerais
        """
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


@extend_schema(tags=["comments"])
class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para comentários
    list: Listar comentários (filtrados por ideia)
    create: Criar comentário
    update: Atualizar comentário
    destroy: Deletar comentário
    """

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["idea", "user", "parent"]

    def get_queryset(self):
        """
        Filtra comentários por ideia se fornecido
        """
        queryset = Comment.objects.select_related("user", "idea", "parent")

        idea_id = self.request.query_params.get("idea", None)
        if idea_id:
            queryset = queryset.filter(idea_id=idea_id)

        return queryset.order_by("created_at")

    def perform_create(self, serializer):
        """
        Salva o usuário autenticado como autor do comentário
        """
        comment = serializer.save(user=self.request.user)

        # Criar notificação para o autor da ideia
        idea = comment.idea
        if idea.autor != self.request.user:
            Notification.objects.create(
                user=idea.autor,
                tipo="comentario",
                mensagem=f"{self.request.user.username} comentou em '{idea.titulo}'",
                idea=idea,
            )

    def perform_destroy(self, instance):
        """
        Apenas o autor do comentário ou admins podem deletar
        """
        if instance.user != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "Você não tem permissão para deletar este comentário."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()


@extend_schema(tags=["notifications"])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para notificações (apenas leitura)
    list: Listar notificações do usuário autenticado
    retrieve: Detalhes de uma notificação
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo", "lido"]

    def get_queryset(self):
        """
        Retorna apenas notificações do usuário autenticado
        """
        return (
            Notification.objects.filter(user=self.request.user)
            .select_related("user", "idea")
            .order_by("-created_at")
        )

    @extend_schema(
        summary="Notificações não lidas",
        description="Retorna apenas notificações não lidas do usuário",
    )
    @action(detail=False, methods=["get"])
    def unread(self, request):
        """
        GET /notifications/unread/
        Retorna apenas notificações não lidas
        """
        unread_notifications = self.get_queryset().filter(lido=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Marcar como lida",
        description="Marca uma notificação específica como lida",
        request=None,
    )
    @action(detail=True, methods=["patch"])
    def mark_read(self, request, pk=None):
        """
        PATCH /notifications/{id}/mark_read/
        Marca notificação como lida
        """
        notification = self.get_object()
        notification.lido = True
        notification.save()
        return Response({"detail": "Notificação marcada como lida."})

    @extend_schema(
        summary="Marcar todas como lidas",
        description="Marca todas as notificações do usuário como lidas",
        request=None,
    )
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """
        POST /notifications/mark_all_read/
        Marca todas as notificações como lidas
        """
        updated = self.get_queryset().filter(lido=False).update(lido=True)
        return Response({"detail": f"{updated} notificações marcadas como lidas."})
