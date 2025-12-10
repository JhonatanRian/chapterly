from django.db import models
from django.utils.text import slugify


class Tag(models.Model):

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
