from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    message = "Apenas administradores podem acessar configurações do sistema."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )
