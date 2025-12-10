from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Case, Count, DecimalField, F, Q, When
from django.utils import timezone


class IdeaQuerySet(models.QuerySet):

    def with_vote_stats(self):
        """
        Anota o queryset com estatísticas de votos otimizadas.

        Adiciona:
        - vote_count_annotated: Total de votos (apenas usuários ativos)
        - vote_percentage_decimal: Porcentagem de votos em decimal (0-100)
        """
        User = get_user_model()
        total_active_users = User.objects.filter(is_active=True).count()

        if total_active_users == 0:
            return self.annotate(
                vote_count_annotated=Count(
                    "votos",
                    filter=Q(votos__user__is_active=True),
                    distinct=True,
                ),
                vote_percentage_decimal=0.0,
            )

        return self.annotate(
            vote_count_annotated=Count(
                "votos",
                filter=Q(votos__user__is_active=True),
                distinct=True,
            ),
            vote_percentage_decimal=Case(
                When(
                    vote_count_annotated__gt=0,
                    then=F("vote_count_annotated") * 100.0 / total_active_users,
                ),
                default=0.0,
                output_field=DecimalField(max_digits=5, decimal_places=2),
            ),
        )

    def optimized(self):
        return self.select_related("autor", "apresentador").prefetch_related(
            "tags", "votos"
        )


class IdeaManager(models.Manager):

    def get_queryset(self):
        return IdeaQuerySet(self.model, using=self._db).optimized()

    def with_vote_stats(self):
        return self.get_queryset().with_vote_stats()


class Idea(models.Model):

    PRIORITY_CHOICES = [
        ("baixa", "Baixa"),
        ("media", "Média"),
        ("alta", "Alta"),
    ]

    titulo = models.CharField(max_length=200)
    descricao = models.TextField(help_text="Descrição curta da ideia")
    conteudo = models.TextField(help_text="Conteúdo detalhado (HTML do TinyMCE)")

    imagem = models.ImageField(
        upload_to="ideas/%Y/%m/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])],
        help_text="Imagem de capa (máx 5MB)",
    )

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ideias_criadas",
    )
    apresentador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="ideias_apresentando",
        blank=True,
        null=True,
        help_text="Quem vai apresentar esta ideia",
    )
    tags = models.ManyToManyField("talks.Tag", related_name="ideias", blank=True)

    prioridade = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="media"
    )

    data_agendada = models.DateTimeField(
        blank=True, null=True, help_text="Data e hora da apresentação"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = IdeaManager()

    class Meta:
        verbose_name = "Ideia"
        verbose_name_plural = "Ideias"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["data_agendada"]),
        ]

    def __str__(self):
        return self.titulo

    if TYPE_CHECKING:
        vote_count_annotated: int
        vote_percentage_decimal: float

    @property
    def status(self):
        """
        Calcula o status dinamicamente baseado em data_agendada.

        - "pendente": data_agendada é NULL
        - "agendado": data_agendada > now()
        - "concluido": data_agendada <= now()
        """
        if self.data_agendada is None:
            return "pendente"

        now = timezone.now()

        if self.data_agendada > now:
            return "agendado"

        return "concluido"

    @property
    def vote_count(self):
        return self.votos.count()

    @property
    def precisa_apresentador(self):
        return self.apresentador is None
