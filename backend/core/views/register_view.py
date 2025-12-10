from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from core.serializers import (
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
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

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
