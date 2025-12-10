
from django.conf import settings
from django.db import models


class Vote(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votos"
    )
    idea = models.ForeignKey("talks.Idea", on_delete=models.CASCADE, related_name="votos")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Voto"
        verbose_name_plural = "Votos"
        unique_together = ["user", "idea"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "idea"]),
        ]

    def __str__(self):
        return f'{self.user.username} votou em "{self.idea.titulo}"'
