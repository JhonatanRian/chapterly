from django.db import models


class RetroTemplate(models.Model):
    nome = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nome do template (ex: 'Start/Stop/Continue')",
    )

    descricao = models.TextField(blank=True, help_text="Descrição do template")

    categorias = models.JSONField(
        help_text=(
            "Lista de categorias do template. Cada categoria deve ter: "
            "name (nome), slug (identificador), icon (emoji/ícone), "
            "color (cor hex). Ex: "
            '[{"name": "What went well", "slug": "went_well", '
            '"icon": "😊", "color": "#10b981"}]'
        )
    )

    is_default = models.BooleanField(
        default=False, help_text="Se este é o template padrão ao criar novas retros"
    )

    is_system = models.BooleanField(
        default=False, help_text="Templates do sistema não podem ser editados/deletados"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "Template de Retrospectiva"
        verbose_name_plural = "Templates de Retrospectiva"

    def __str__(self):
        return self.nome

    def save(self, *args, **kwargs):
        if self.is_default:
            RetroTemplate.objects.filter(is_default=True).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)

    @classmethod
    def get_default_template(cls):
        return cls.objects.filter(is_default=True).first() or cls.objects.first()

    def get_categoria_by_slug(self, slug):
        for cat in self.categorias:
            if cat.get("slug") == slug:
                return cat
        return None
