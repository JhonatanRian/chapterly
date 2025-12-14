from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Comment,
    Idea,
    Notification,
    Retro,
    RetroItem,
    RetroTemplate,
    Tag,
    Vote,
)


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
        "prioridade",
        "vote_count_display",
        "data_agendada",
        "created_at",
    ]
    list_filter = ["prioridade", "created_at", "data_agendada"]
    search_fields = ["titulo", "descricao", "autor__username", "apresentador__username"]
    filter_horizontal = ["tags"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "vote_count_display",
        "status",
    ]
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
                    "prioridade",
                    "data_agendada",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "status",
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

    def status(self, obj):
        return obj.status

    status.short_description = "Status"

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


@admin.register(RetroTemplate)
class RetroTemplateAdmin(admin.ModelAdmin):
    list_display = ["nome", "is_default", "is_system", "total_retros", "created_at"]
    list_filter = ["is_default", "is_system", "created_at"]
    search_fields = ["nome", "descricao"]
    readonly_fields = ["created_at", "updated_at", "total_retros"]

    fieldsets = (
        ("Informações Básicas", {"fields": ("nome", "descricao", "categorias")}),
        ("Configurações", {"fields": ("is_default", "is_system")}),
        (
            "Metadados",
            {
                "fields": ("total_retros", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def total_retros(self, obj):
        return obj.retros.count()

    total_retros.short_description = "Total de Retros"

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_system:
            return False
        return super().has_delete_permission(request, obj)


class RetroItemInline(admin.TabularInline):
    model = RetroItem
    extra = 0
    fields = ["categoria", "conteudo", "autor", "ordem", "vote_count_display"]
    readonly_fields = ["vote_count_display"]

    def vote_count_display(self, obj):
        if obj.pk:
            return obj.vote_count
        return 0

    vote_count_display.short_description = "Votos"


@admin.register(Retro)
class RetroAdmin(admin.ModelAdmin):
    list_display = [
        "titulo",
        "data",
        "status",
        "autor",
        "template",
        "total_items_display",
        "total_participantes_display",
        "created_at",
    ]
    list_filter = ["status", "template", "data", "created_at"]
    search_fields = ["titulo", "descricao", "autor__username"]
    filter_horizontal = ["participantes"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "total_items_display",
        "total_participantes_display",
        "total_votos_display",
    ]
    date_hierarchy = "data"
    inlines = [RetroItemInline]

    fieldsets = (
        (
            "Informações Básicas",
            {"fields": ("titulo", "descricao", "data", "status", "template")},
        ),
        ("Participação", {"fields": ("autor", "participantes")}),
        (
            "Estatísticas",
            {
                "fields": (
                    "total_items_display",
                    "total_participantes_display",
                    "total_votos_display",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Metadados",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def total_items_display(self, obj):
        if obj.pk:
            return obj.total_items
        return 0

    total_items_display.short_description = "Total de Itens"

    def total_participantes_display(self, obj):
        if obj.pk:
            return obj.total_participantes
        return 0

    total_participantes_display.short_description = "Total de Participantes"

    def total_votos_display(self, obj):
        if obj.pk:
            return obj.total_votos
        return 0

    total_votos_display.short_description = "Total de Votos"


@admin.register(RetroItem)
class RetroItemAdmin(admin.ModelAdmin):
    list_display = [
        "retro",
        "categoria",
        "conteudo_preview",
        "autor",
        "vote_count_display",
        "created_at",
    ]
    list_filter = ["categoria", "created_at", "retro"]
    search_fields = ["conteudo", "autor__username", "retro__titulo"]
    readonly_fields = ["created_at", "updated_at", "vote_count_display"]
    filter_horizontal = ["votes"]

    def conteudo_preview(self, obj):
        preview = obj.conteudo[:50]
        if len(obj.conteudo) > 50:
            preview += "..."
        return preview

    conteudo_preview.short_description = "Conteúdo"

    def vote_count_display(self, obj):
        if obj.pk:
            return obj.vote_count
        return 0

    vote_count_display.short_description = "Votos"
