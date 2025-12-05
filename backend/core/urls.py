from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    RegisterView,
    UserProfileView,
    UserStatsView,
)

urlpatterns = [
    # Autenticação
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Perfil e estatísticas
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("stats/", UserStatsView.as_view(), name="stats"),
    # Mudança de senha
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
