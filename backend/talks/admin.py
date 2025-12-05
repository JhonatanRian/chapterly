from django.contrib import admin
from django.utils.html import format_html

from .models import Comment, Idea, Notification, Tag, Vote


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["nome", "slug", "cor_display", "created_at"]
    search_fields = ["nome", "slug"]
    prepopulated_fields = {"slug": ("nome",)}
    readonly_fields = ["created_at"]

    def cor_display(self, obj):
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; border-radius: 3px; color: white;">{}</span>',
            obj.cor,
            obj.cor,
        )

    cor_display.short_description = "Cor"


@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = [
        "titulo",
        "autor",
        "apresentador",
        "status",
        "prioridade",
        "vote_count_display",
        "data_agendada",
        "created_at",
    ]
    list_filter = ["status", "prioridade", "created_at", "data_agendada"]
    search_fields = ["titulo", "descricao", "autor__username", "apresentador__username"]
    filter_horizontal = ["tags"]
    readonly_fields = ["created_at", "updated_at", "vote_count_display"]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Informações Básicas",
            {
                "fields": (
                    "titulo",
                    "descricao",
                    "conteudo",
                    "imagem",
                )
            },
        ),
        (
            "Pessoas",
            {
                "fields": (
                    "autor",
                    "apresentador",
                )
            },
        ),
        (
            "Organização",
            {
                "fields": (
                    "tags",
                    "status",
                    "prioridade",
                    "data_agendada",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "vote_count_display",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def vote_count_display(self, obj):
        return obj.vote_count

    vote_count_display.short_description = "Votos"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("autor", "apresentador").prefetch_related("tags")


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["user", "idea", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__username", "idea__titulo"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "idea")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["user", "idea", "conteudo_preview", "parent", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__username", "idea__titulo", "conteudo"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    def conteudo_preview(self, obj):
        return obj.conteudo[:50] + "..." if len(obj.conteudo) > 50 else obj.conteudo

    conteudo_preview.short_description = "Conteúdo"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "idea", "parent")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "tipo", "mensagem_preview", "lido", "created_at"]
    list_filter = ["tipo", "lido", "created_at"]
    search_fields = ["user__username", "mensagem"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"

    def mensagem_preview(self, obj):
        return obj.mensagem[:50] + "..." if len(obj.mensagem) > 50 else obj.mensagem

    mensagem_preview.short_description = "Mensagem"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "idea")

    actions = ["mark_as_read", "mark_as_unread"]

    def mark_as_read(self, request, queryset):
        updated = queryset.update(lido=True)
        self.message_user(request, f"{updated} notificações marcadas como lidas.")

    mark_as_read.short_description = "Marcar como lida"

    def mark_as_unread(self, request, queryset):
        updated = queryset.update(lido=False)
        self.message_user(request, f"{updated} notificações marcadas como não lidas.")

    mark_as_unread.short_description = "Marcar como não lida"
