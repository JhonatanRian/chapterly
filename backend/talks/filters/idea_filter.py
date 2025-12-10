import django_filters
from django.db.models import Q

from talks.models import Idea, Tag


class IdeaFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(
        field_name="status",
        choices=[
            ("pendente", "Pendente"),
            ("agendado", "Agendado"),
            ("concluido", "Concluído"),
        ],
        method="filter_status",
        help_text="Filtrar por status",
    )

    prioridade = django_filters.ChoiceFilter(
        field_name="prioridade",
        choices=Idea.PRIORITY_CHOICES,
        help_text="Filtrar por prioridade",
    )

    autor = django_filters.NumberFilter(field_name="autor__id", help_text="ID do autor")
    autor_username = django_filters.CharFilter(
        field_name="autor__username",
        lookup_expr="icontains",
        help_text="Username do autor",
    )

    apresentador = django_filters.NumberFilter(
        field_name="apresentador__id", help_text="ID do apresentador"
    )
    apresentador_username = django_filters.CharFilter(
        field_name="apresentador__username",
        lookup_expr="icontains",
        help_text="Username do apresentador",
    )

    precisa_apresentador = django_filters.BooleanFilter(
        method="filter_precisa_apresentador",
        help_text="true para ideias sem apresentador",
    )

    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags",
        queryset=Tag.objects.all(),
        help_text="Filtrar por tags (IDs separados por vírgula)",
    )

    tags_slug = django_filters.CharFilter(
        method="filter_by_tags_slug", help_text="Filtrar por slug da tag"
    )

    search = django_filters.CharFilter(
        method="filter_search", help_text="Buscar em título ou descrição"
    )

    data_agendada_antes = django_filters.DateTimeFilter(
        field_name="data_agendada",
        lookup_expr="lte",
        help_text="Apresentações antes desta data",
    )

    data_agendada_depois = django_filters.DateTimeFilter(
        field_name="data_agendada",
        lookup_expr="gte",
        help_text="Apresentações depois desta data",
    )

    votos_minimos = django_filters.NumberFilter(
        method="filter_votos_minimos", help_text="Mínimo de votos"
    )

    class Meta:
        model = Idea
        fields = [
            "prioridade",
            "autor",
            "apresentador",
            "tags",
            "precisa_apresentador",
        ]

    def filter_status(self, queryset, name, value):
        from django.utils import timezone

        if not value:
            return queryset

        now = timezone.now()

        if value == "pendente":
            return queryset.filter(data_agendada__isnull=True)
        elif value == "agendado":
            return queryset.filter(data_agendada__gt=now)
        elif value == "concluido":
            return queryset.filter(data_agendada__lte=now)

        return queryset

    def filter_precisa_apresentador(self, queryset, name, value):
        if value:
            return queryset.filter(apresentador__isnull=True)
        else:
            return queryset.filter(apresentador__isnull=False)

    def filter_by_tags_slug(self, queryset, name, value):
        return queryset.filter(tags__slug__iexact=value).distinct()

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(titulo__icontains=value)
            | Q(descricao__icontains=value)
            | Q(conteudo__icontains=value)
        ).distinct()

    def filter_votos_minimos(self, queryset, name, value):
        from django.db.models import Count

        return queryset.annotate(total_votes=Count("votos")).filter(
            total_votes__gte=value
        )
