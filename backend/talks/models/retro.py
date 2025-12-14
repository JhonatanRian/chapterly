from django.db import models
from django.utils import timezone
from core.models import User


class RetroStatus(models.TextChoices):
    RASCUNHO = "rascunho", "Rascunho"
    EM_ANDAMENTO = "em_andamento", "Em Andamento"
    CONCLUIDA = "concluida", "Concluída"


class Retro(models.Model):
    titulo = models.CharField(
        max_length=200, help_text="Título da retrospectiva (ex: 'Retro Sprint 15')"
    )

    descricao = models.TextField(
        blank=True, help_text="Descrição opcional da retrospectiva"
    )

    data = models.DateTimeField(
        default=timezone.now, help_text="Data e hora da retrospectiva"
    )

    template = models.ForeignKey(
        "RetroTemplate",
        on_delete=models.PROTECT,
        related_name="retros",
        help_text="Template utilizado (define as categorias de itens)",
    )

    autor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="retros_criadas",
        help_text="Usuário que criou a retrospectiva",
    )

    status = models.CharField(
        max_length=20,
        choices=RetroStatus.choices,
        default=RetroStatus.RASCUNHO,
        help_text="Status atual da retrospectiva",
    )

    participantes = models.ManyToManyField(
        User,
        related_name="retros_participadas",
        blank=True,
        help_text="Usuários que participaram da retrospectiva",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data", "-created_at"]
        verbose_name = "Retrospectiva"
        verbose_name_plural = "Retrospectivas"
        indexes = [
            models.Index(fields=["-data"]),
            models.Index(fields=["status"]),
            models.Index(fields=["autor"]),
        ]

    def __str__(self):
        return f"{self.titulo} ({self.get_status_display()})"

    @property
    def total_items(self):
        return self.items.count()

    @property
    def total_participantes(self):
        return self.participantes.count()

    @property
    def total_votos(self):
        return sum(item.vote_count for item in self.items.all())
