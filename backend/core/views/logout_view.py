from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


@extend_schema(
    tags=["auth"],
    summary="Logout",
    description="Faz logout do usuário e adiciona o refresh token à blacklist",
)
class LogoutView(APIView):
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
