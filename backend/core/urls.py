from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from core import views

urlpatterns = [
    # Autenticação
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Perfil e estatísticas
    path("profile/", views.UserProfileView.as_view(), name="profile"),
    path("stats/", views.UserStatsView.as_view(), name="stats"),
    # Mudança de senha
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change_password"
    ),
]
