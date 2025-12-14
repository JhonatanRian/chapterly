from django.urls import include, path
from rest_framework.routers import DefaultRouter

from talks.views import api_views, viewsets

router = DefaultRouter()

router.register(r"ideas", viewsets.IdeaViewSet, basename="idea")
router.register(r"tags", viewsets.TagViewSet, basename="tag")
router.register(r"comments", viewsets.CommentViewSet, basename="comment")
router.register(r"notifications", viewsets.NotificationViewSet, basename="notification")
router.register(r"retros", viewsets.RetroViewSet, basename="retro")
router.register(
    r"retro-templates", viewsets.RetroTemplateViewSet, basename="retro-template"
)

urlpatterns = [
    path("", include(router.urls)),
    path("upload/image/", api_views.upload_image, name="upload-image"),
]
