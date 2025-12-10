from django.conf import settings
from django.db import models


class Comment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comentarios"
    )
    idea = models.ForeignKey(
        "talks.Idea", on_delete=models.CASCADE, related_name="comentarios"
    )
    conteudo = models.TextField()
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="respostas",
        blank=True,
        null=True,
        help_text="Comentário pai (para respostas)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Comentário"
        verbose_name_plural = "Comentários"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["idea", "created_at"]),
        ]

    def __str__(self):
        return f'{self.user.username} comentou em "{self.idea.titulo}"'
