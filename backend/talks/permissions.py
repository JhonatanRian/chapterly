from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada para permitir apenas o autor editar/deletar
    Outros usuários podem apenas visualizar (GET, HEAD, OPTIONS)
    """

    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para todos
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissões de escrita apenas para o autor
        return obj.autor == request.user


class IsPresenterOrOwnerOrAdmin(permissions.BasePermission):
    """
    Permissão customizada para ações específicas de apresentador
    Permite acesso para:
    - Autor da ideia
    - Apresentador atual
    - Administradores
    """

    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para todos
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admins têm acesso total
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Autor e apresentador podem editar
        return obj.autor == request.user or obj.apresentador == request.user


class IsOwner(permissions.BasePermission):
    """
    Permissão que permite acesso apenas ao dono do objeto
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
