from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Comment, Idea, Notification, Tag, Vote
from .permissions import IsOwner, IsOwnerOrReadOnly, IsPresenterOrOwnerOrAdmin
from .serializers import (
    CommentSerializer,
    IdeaCreateUpdateSerializer,
    IdeaDetailSerializer,
    IdeaListSerializer,
    NotificationSerializer,
    TagSerializer,
)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para tags (apenas leitura)
    list: Listar todas as tags
    retrieve: Detalhes de uma tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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

    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ["status", "prioridade", "autor", "apresentador"]
    search_fields = ["titulo", "descricao", "autor__username"]
    ordering_fields = ["created_at", "data_agendada", "vote_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Otimiza queries com select_related e prefetch_related
        Adiciona anotação de vote_count para ordenação
        """
        queryset = Idea.objects.select_related(
            "autor", "apresentador"
        ).prefetch_related("tags", "votos")

        # Anota com contagem de votos para poder ordenar
        queryset = queryset.annotate(vote_count=Count("votos"))

        # Filtros adicionais via query params
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        tags_filter = self.request.query_params.get("tags", None)
        if tags_filter:
            tag_ids = tags_filter.split(",")
            queryset = queryset.filter(tags__id__in=tag_ids).distinct()

        # Filtro: apenas ideias que precisam de apresentador
        precisa_apresentador = self.request.query_params.get(
            "precisa_apresentador", None
        )
        if precisa_apresentador and precisa_apresentador.lower() == "true":
            queryset = queryset.filter(apresentador__isnull=True)

        return queryset

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

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """
        GET /ideas/upcoming/
        Retorna as próximas 5 apresentações agendadas
        """
        upcoming_ideas = (
            Idea.objects.filter(status="agendado", data_agendada__gte=timezone.now())
            .select_related("autor", "apresentador")
            .prefetch_related("tags")
            .order_by("data_agendada")[:5]
        )

        serializer = IdeaListSerializer(
            upcoming_ideas, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def timeline(self, request):
        """
        GET /ideas/timeline/
        Retorna todas as apresentações agendadas, ordenadas por data
        """
        timeline_ideas = (
            Idea.objects.filter(status="agendado", data_agendada__isnull=False)
            .select_related("autor", "apresentador")
            .prefetch_related("tags")
            .order_by("data_agendada")
        )

        serializer = IdeaListSerializer(
            timeline_ideas, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        GET /ideas/stats/
        Retorna estatísticas gerais
        """
        total_ideias = Idea.objects.count()
        pendentes = Idea.objects.filter(status="pendente").count()
        agendadas = Idea.objects.filter(status="agendado").count()
        concluidas = Idea.objects.filter(status="concluido").count()
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


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para notificações (apenas leitura)
    list: Listar notificações do usuário autenticado
    retrieve: Detalhes de uma notificação
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retorna apenas notificações do usuário autenticado
        """
        return (
            Notification.objects.filter(user=self.request.user)
            .select_related("user", "idea")
            .order_by("-created_at")
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

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """
        POST /notifications/mark_all_read/
        Marca todas as notificações como lidas
        """
        updated = self.get_queryset().filter(lido=False).update(lido=True)
        return Response({"detail": f"{updated} notificações marcadas como lidas."})
