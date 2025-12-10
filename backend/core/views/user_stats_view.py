from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


@extend_schema(
    tags=["auth"],
    summary="Estatísticas do usuário",
    description="Retorna estatísticas detalhadas do usuário autenticado",
)
class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Contadores
        ideias_criadas = user.ideias_criadas.count()
        apresentacoes = user.ideias_apresentando.count()
        votos_dados = user.votos.count()

        # Ideias por status (calculado dinamicamente via property)
        now = timezone.now()
        ideias_pendentes = user.ideias_criadas.filter(
            data_agendada__isnull=True
        ).count()
        ideias_agendadas = user.ideias_criadas.filter(data_agendada__gt=now).count()
        ideias_concluidas = user.ideias_criadas.filter(data_agendada__lte=now).count()

        # Apresentações por status (calculado dinamicamente via property)
        apresentacoes_agendadas = user.ideias_apresentando.filter(
            data_agendada__gt=now
        ).count()
        apresentacoes_concluidas = user.ideias_apresentando.filter(
            data_agendada__lte=now
        ).count()

        # Votos recebidos nas ideias criadas
        votos_recebidos = sum(idea.vote_count for idea in user.ideias_criadas.all())

        stats = {
            "ideias_criadas": ideias_criadas,
            "apresentacoes": apresentacoes,
            "votos_dados": votos_dados,
            "votos_recebidos": votos_recebidos,
            "ideias_por_status": {
                "pendentes": ideias_pendentes,
                "agendadas": ideias_agendadas,
                "concluidas": ideias_concluidas,
            },
            "apresentacoes_por_status": {
                "agendadas": apresentacoes_agendadas,
                "concluidas": apresentacoes_concluidas,
            },
        }

        return Response(stats)
