from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.text import slugify


class Tag(models.Model):
    """Tags para categorizar ideias"""

    nome = models.CharField(max_length=50, unique=True)
    cor = models.CharField(
        max_length=7, default="#0066FF", help_text="Cor em hexadecimal"
    )
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["nome"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nome)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome


class Idea(models.Model):
    """Modelo principal para ideias de apresentação"""

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("agendado", "Agendado"),
        ("concluido", "Concluído"),
    ]

    PRIORITY_CHOICES = [
        ("baixa", "Baixa"),
        ("media", "Média"),
        ("alta", "Alta"),
    ]

    # Informações básicas
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(help_text="Descrição curta da ideia")
    conteudo = models.TextField(help_text="Conteúdo detalhado (HTML do TinyMCE)")

    # Imagem
    imagem = models.ImageField(
        upload_to="ideas/%Y/%m/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])],
        help_text="Imagem de capa (máx 5MB)",
    )

    # Relacionamentos
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
    tags = models.ManyToManyField(Tag, related_name="ideias", blank=True)

    # Status e prioridade
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    prioridade = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="media"
    )

    # Datas
    data_agendada = models.DateTimeField(
        blank=True, null=True, help_text="Data e hora da apresentação"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ideia"
        verbose_name_plural = "Ideias"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["data_agendada"]),
        ]

    def __str__(self):
        return self.titulo

    @property
    def vote_count(self):
        """Retorna o número de votos"""
        return self.votos.count()

    @property
    def precisa_apresentador(self):
        """Verifica se precisa de apresentador"""
        return self.apresentador is None


class Vote(models.Model):
    """Votos em ideias"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votos"
    )
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="votos")
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


class Comment(models.Model):
    """Comentários em ideias"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comentarios"
    )
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="comentarios")
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


class Notification(models.Model):
    """Notificações para usuários"""

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
        Idea,
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
