from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


@extend_schema(
    tags=["auth"],
    summary="Registrar usuário",
    description="Registra um novo usuário e retorna tokens JWT",
)
class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Registrar novo usuário
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserProfileSerializer(user, context={"request": request}).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Usuário registrado com sucesso!",
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["auth"],
    summary="Login",
    description="Autentica um usuário e retorna tokens JWT",
)
class LoginView(APIView):
    """
    POST /api/auth/login/
    Login de usuário
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserProfileSerializer(user, context={"request": request}).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Login realizado com sucesso!",
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["auth"],
    summary="Perfil do usuário",
    description="Obtém ou atualiza o perfil do usuário autenticado",
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile/
    Obter perfil do usuário autenticado

    PUT/PATCH /api/auth/profile/
    Atualizar perfil do usuário autenticado
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Retorna o usuário autenticado"""
        return self.request.user


@extend_schema(
    tags=["auth"],
    summary="Estatísticas do usuário",
    description="Retorna estatísticas detalhadas do usuário autenticado",
)
class UserStatsView(APIView):
    """
    GET /api/auth/stats/
    Retorna estatísticas detalhadas do usuário autenticado
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Contadores
        ideias_criadas = user.ideias_criadas.count()
        apresentacoes = user.ideias_apresentando.count()
        votos_dados = user.votos.count()

        # Ideias por status
        ideias_pendentes = user.ideias_criadas.filter(status="pendente").count()
        ideias_agendadas = user.ideias_criadas.filter(status="agendado").count()
        ideias_concluidas = user.ideias_criadas.filter(status="concluido").count()

        # Apresentações por status
        apresentacoes_agendadas = user.ideias_apresentando.filter(
            status="agendado"
        ).count()
        apresentacoes_concluidas = user.ideias_apresentando.filter(
            status="concluido"
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


@extend_schema(
    tags=["auth"],
    summary="Alterar senha",
    description="Altera a senha do usuário autenticado",
)
class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Alterar senha do usuário autenticado
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Senha alterada com sucesso!"}, status=status.HTTP_200_OK
        )


@extend_schema(
    tags=["auth"],
    summary="Logout",
    description="Faz logout do usuário e adiciona o refresh token à blacklist",
)
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logout do usuário (blacklist do refresh token)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response(
                {"message": "Logout realizado com sucesso!"},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Token inválido."}, status=status.HTTP_400_BAD_REQUEST
            )
