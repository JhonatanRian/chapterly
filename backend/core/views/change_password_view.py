from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.serializers import (
    ChangePasswordSerializer,
)


@extend_schema(
    tags=["auth"],
    summary="Alterar senha",
    description="Altera a senha do usuário autenticado",
)
class ChangePasswordView(APIView):
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
