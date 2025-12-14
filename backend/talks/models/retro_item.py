from core.models import User
from django.db import models
from django.db.models import Count


class RetroItemManager(models.Manager):
    def with_vote_stats(self):
        return self.annotate(vote_count=Count("votes", distinct=True))


class RetroItem(models.Model):
    retro = models.ForeignKey(
        "Retro",
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Retrospectiva à qual este item pertence",
    )

    categoria = models.CharField(
        max_length=50,
        help_text="Slug da categoria (ex: 'went_well', 'to_improve', 'action_items')",
    )

    conteudo = models.TextField(help_text="Conteúdo do item (texto do card)")

    autor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="retro_items",
        help_text="Usuário que criou este item",
    )

    votes = models.ManyToManyField(
        User,
        related_name="retro_items_votados",
        blank=True,
        help_text="Usuários que votaram neste item",
    )

    ordem = models.IntegerField(
        default=0, help_text="Ordem de exibição dentro da categoria"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = RetroItemManager()

    class Meta:
        ordering = ["categoria", "-votes__id", "ordem", "-created_at"]
        verbose_name = "Item de Retrospectiva"
        verbose_name_plural = "Itens de Retrospectiva"
        indexes = [
            models.Index(fields=["retro", "categoria"]),
            models.Index(fields=["autor"]),
        ]

    def __str__(self):
        preview = self.conteudo[:50]
        if len(self.conteudo) > 50:
            preview += "..."
        return f"[{self.categoria}] {preview}"

    @property
    def vote_count(self):
        return self.votes.count()

    def has_voted(self, user):
        return (
            self.votes.filter(id=user.id).exists() if user.is_authenticated else False
        )

    def toggle_vote(self, user):
        if self.has_voted(user):
            self.votes.remove(user)
            return False
        else:
            self.votes.add(user)
            return True
