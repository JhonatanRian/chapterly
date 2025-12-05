import django_filters
from django.db.models import Q

from .models import Idea, Tag


class IdeaFilter(django_filters.FilterSet):
    """
    FilterSet customizado para Idea com filtros avançados
    """

    # Filtros básicos
    status = django_filters.ChoiceFilter(
        field_name="status",
        choices=Idea.STATUS_CHOICES,
        help_text="Filtrar por status",
    )

    prioridade = django_filters.ChoiceFilter(
        field_name="prioridade",
        choices=Idea.PRIORITY_CHOICES,
        help_text="Filtrar por prioridade",
    )

    # Filtro por autor
    autor = django_filters.NumberFilter(field_name="autor__id", help_text="ID do autor")
    autor_username = django_filters.CharFilter(
        field_name="autor__username",
        lookup_expr="icontains",
        help_text="Username do autor",
    )

    # Filtro por apresentador
    apresentador = django_filters.NumberFilter(
        field_name="apresentador__id", help_text="ID do apresentador"
    )
    apresentador_username = django_filters.CharFilter(
        field_name="apresentador__username",
        lookup_expr="icontains",
        help_text="Username do apresentador",
    )

    # Filtro especial: ideias que precisam de apresentador
    precisa_apresentador = django_filters.BooleanFilter(
        method="filter_precisa_apresentador",
        help_text="true para ideias sem apresentador",
    )

    # Filtro por tags (aceita múltiplas tags)
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags",
        queryset=Tag.objects.all(),
        help_text="Filtrar por tags (IDs separados por vírgula)",
    )

    # Filtro por slug de tag
    tags_slug = django_filters.CharFilter(
        method="filter_by_tags_slug", help_text="Filtrar por slug da tag"
    )

    # Busca geral (título ou descrição)
    search = django_filters.CharFilter(
        method="filter_search", help_text="Buscar em título ou descrição"
    )

    # Filtros de data
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

    # Filtro de votos mínimos
    votos_minimos = django_filters.NumberFilter(
        method="filter_votos_minimos", help_text="Mínimo de votos"
    )

    class Meta:
        model = Idea
        fields = [
            "status",
            "prioridade",
            "autor",
            "apresentador",
            "tags",
            "precisa_apresentador",
        ]

    def filter_precisa_apresentador(self, queryset, name, value):
        """
        Filtra ideias que precisam ou não de apresentador
        """
        if value:
            return queryset.filter(apresentador__isnull=True)
        else:
            return queryset.filter(apresentador__isnull=False)

    def filter_by_tags_slug(self, queryset, name, value):
        """
        Filtra por slug de tag
        """
        return queryset.filter(tags__slug__iexact=value).distinct()

    def filter_search(self, queryset, name, value):
        """
        Busca em título, descrição e conteúdo
        """
        return queryset.filter(
            Q(titulo__icontains=value)
            | Q(descricao__icontains=value)
            | Q(conteudo__icontains=value)
        ).distinct()

    def filter_votos_minimos(self, queryset, name, value):
        """
        Filtra ideias com número mínimo de votos
        Requer anotação no queryset
        """
        from django.db.models import Count

        return queryset.annotate(vote_count=Count("votos")).filter(
            vote_count__gte=value
        )
