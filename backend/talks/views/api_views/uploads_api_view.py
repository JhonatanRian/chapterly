from django.core.files.storage import default_storage
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response


@extend_schema(tags=["upload"])
@api_view(http_method_names=["POST"])
@parser_classes(parser_classes=[MultiPartParser, FormParser])
def upload_image(request):
    if "image" not in request.FILES:
        return Response(
            {"error": "Nenhuma imagem foi enviada"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    image = request.FILES["image"]

    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        return Response(
            {"error": "Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    max_size = 5 * 1024 * 1024  # 5MB
    if image.size > max_size:
        return Response(
            {"error": "Imagem muito grande. Tamanho máximo: 5MB"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file_path = f"ideas/content/{image.name}"
    saved_path = default_storage.save(file_path, image)
    file_url = request.build_absolute_uri(default_storage.url(saved_path))

    return Response(
        data={
            "url": file_url,
            "name": image.name,
            "size": image.size,
        },
        status=status.HTTP_201_CREATED,
    )

