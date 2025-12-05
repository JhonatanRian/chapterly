from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "ideias_count",
        "apresentacoes_count",
        "votos_count",
        "is_staff",
        "date_joined",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active", "date_joined"]
    search_fields = ["username", "email", "first_name", "last_name"]
    readonly_fields = [
        "date_joined",
        "last_login",
        "ideias_count",
        "apresentacoes_count",
        "votos_count",
    ]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Informações Pessoais",
            {"fields": ("first_name", "last_name", "email")},
        ),
        (
            "Permissões",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Estatísticas",
            {
                "fields": (
                    "ideias_count",
                    "apresentacoes_count",
                    "votos_count",
                    "date_joined",
                    "last_login",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def ideias_count(self, obj):
        return obj.ideias_criadas.count()

    ideias_count.short_description = "Ideias Criadas"

    def apresentacoes_count(self, obj):
        return obj.ideias_apresentando.count()

    apresentacoes_count.short_description = "Apresentações"

    def votos_count(self, obj):
        return obj.votos.count()

    votos_count.short_description = "Votos Dados"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related("ideias_criadas", "ideias_apresentando", "votos")
