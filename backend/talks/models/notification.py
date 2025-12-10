from django.conf import settings
from django.db import models


class Notification(models.Model):

    TIPO_CHOICES = [
        ("voto", "Novo Voto"),
        ("voluntario", "Novo Voluntário"),
        ("agendamento", "Apresentação Agendada"),
        ("comentario", "Novo Comentário"),
        ("mencao", "Menção"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificacoes"
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensagem = models.TextField()
    idea = models.ForeignKey(
        "talks.Idea",
        on_delete=models.CASCADE,
        related_name="notificacoes",
        blank=True,
        null=True,
    )
    lido = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "lido"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.tipo} para {self.user.username}"
