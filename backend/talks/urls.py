from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CommentViewSet,
    IdeaViewSet,
    NotificationViewSet,
    TagViewSet,
    upload_image,
)

# Criar router
router = DefaultRouter()

# Registrar ViewSets
router.register(r"ideas", IdeaViewSet, basename="idea")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("upload/image/", upload_image, name="upload-image"),
]
