from django.core.cache import cache
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class SystemConfiguration(models.Model):
    chapter_enabled = models.BooleanField(
        default=True,
        verbose_name="Chapter Habilitado",
        help_text="Habilita/desabilita o módulo Chapter (ideias/apresentações)",
    )

    retro_enabled = models.BooleanField(
        default=True,
        verbose_name="Retro Habilitado",
        help_text="Habilita/desabilita o módulo Retro (retrospectivas)",
    )

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    updated_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="config_updates",
        verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Configuração do Sistema"
        verbose_name_plural = "Configurações do Sistema"
        db_table = "system_configuration"

    def __str__(self):
        return "Configuração do Sistema"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
        cache.delete("system_configuration")

    @classmethod
    def get_config(cls):
        config = cache.get("system_configuration")
        if config is None:
            config, created = cls.objects.get_or_create(pk=1)
            cache.set("system_configuration", config, timeout=3600)  # 1 hora
            if created:
                print("✅ SystemConfiguration criada com valores padrão")
        return config

    @classmethod
    def is_chapter_enabled(cls):
        return cls.get_config().chapter_enabled

    @classmethod
    def is_retro_enabled(cls):
        return cls.get_config().retro_enabled


@receiver(post_save, sender=SystemConfiguration)
def invalidate_config_cache(sender, instance, **kwargs):
    cache.delete("system_configuration")
