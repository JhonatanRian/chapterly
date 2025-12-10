from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from core.serializers import (
    UserProfileSerializer,
)


@extend_schema(
    tags=["auth"],
    summary="Perfil do usuário",
    description="Obtém ou atualiza o perfil do usuário autenticado",
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
