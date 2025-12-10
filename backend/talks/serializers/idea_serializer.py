from core.models import User
from rest_framework.serializers import (
    BooleanField,
    ModelSerializer,
    PrimaryKeyRelatedField,
    SerializerMethodField,
    ValidationError,
)

from talks.models import Idea, Tag, Vote
from talks.serializers.comment_serializer import CommentSerializer
from talks.serializers.tag_serializer import TagSerializer
from talks.serializers.vote_serializer import VoteSerializer

from .user_serializer import UserSerializer


class IdeaListSerializer(ModelSerializer):
    autor = UserSerializer(read_only=True)
    apresentador = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    vote_count = SerializerMethodField(read_only=True)
    vote_percentage = SerializerMethodField(read_only=True)
    has_voted = SerializerMethodField()
    precisa_apresentador = BooleanField(read_only=True)

    class Meta:
        model = Idea
        fields = [
            "id",
            "titulo",
            "descricao",
            "imagem",
            "autor",
            "apresentador",
            "tags",
            "status",
            "prioridade",
            "data_agendada",
            "vote_count",
            "vote_percentage",
            "has_voted",
            "precisa_apresentador",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, idea=obj).exists()
        return False

    def get_vote_count(self, obj: Idea) -> int:
        if hasattr(obj, "vote_count_annotated"):
            return obj.vote_count_annotated
        return obj.votos.filter(user__is_active=True).count()

    def get_vote_percentage(self, obj: Idea) -> str:
        if hasattr(obj, "vote_percentage_decimal"):
            percentage = float(obj.vote_percentage_decimal)
            return f"{percentage:.2f}%"

        total_users = User.objects.filter(is_active=True).count()
        total_votos = self.get_vote_count(obj)
        result = (total_votos / total_users) * 100 if total_users > 0 else 0
        return f"{result:.2f}%"


class IdeaDetailSerializer(ModelSerializer):
    autor = UserSerializer(read_only=True)
    apresentador = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    votos = VoteSerializer(many=True, read_only=True)
    comentarios = SerializerMethodField()
    vote_count = SerializerMethodField(read_only=True)
    vote_percentage = SerializerMethodField(read_only=True)
    has_voted = SerializerMethodField()
    precisa_apresentador = BooleanField(read_only=True)
    is_presenter = SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            "id",
            "titulo",
            "descricao",
            "conteudo",
            "imagem",
            "autor",
            "apresentador",
            "tags",
            "status",
            "prioridade",
            "data_agendada",
            "votos",
            "comentarios",
            "vote_count",
            "vote_percentage",
            "has_voted",
            "precisa_apresentador",
            "is_presenter",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_comentarios(self, obj):
        comentarios_raiz = obj.comentarios.filter(parent__isnull=True)
        return CommentSerializer(comentarios_raiz, many=True).data

    def get_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, idea=obj).exists()
        return False

    def get_is_presenter(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.apresentador == request.user
        return False

    def get_vote_count(self, obj: Idea) -> int:
        if hasattr(obj, "vote_count_annotated"):
            return obj.vote_count_annotated
        return obj.votos.filter(user__is_active=True).count()

    def get_vote_percentage(self, obj: Idea) -> str:
        if hasattr(obj, "vote_percentage_decimal"):
            percentage = float(obj.vote_percentage_decimal)
            return f"{percentage:.2f}%"

        total_users = User.objects.filter(is_active=True).count()
        total_votos = self.get_vote_count(obj)
        result = (total_votos / total_users) * 100 if total_users > 0 else 0
        return f"{result:.2f}%"


class IdeaCreateUpdateSerializer(ModelSerializer):
    tags = PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all(), required=False)
    quero_apresentar = BooleanField(write_only=True, required=False)

    class Meta:
        model = Idea
        fields = [
            "id",
            "titulo",
            "descricao",
            "conteudo",
            "imagem",
            "tags",
            "prioridade",
            "quero_apresentar",
        ]
        read_only_fields = ["id"]

    def validate_titulo(self, value):
        if len(value) < 5:
            raise ValidationError("O título deve ter pelo menos 5 caracteres.")
        return value

    def validate_descricao(self, value):
        if len(value) < 10:
            raise ValidationError("A descrição deve ter pelo menos 10 caracteres.")
        return value

    def validate_imagem(self, value):
        if value and value.size > 5 * 1024 * 1024:  # 5MB
            raise ValidationError("A imagem não pode ter mais de 5MB.")
        return value

    def create(self, validated_data):
        quero_apresentar = validated_data.pop("quero_apresentar", False)
        tags = validated_data.pop("tags", [])

        validated_data["autor"] = self.context["request"].user

        if quero_apresentar:
            validated_data["apresentador"] = self.context["request"].user

        idea = Idea.objects.create(**validated_data)

        if tags:
            idea.tags.set(tags)

        return idea

    def update(self, instance, validated_data):
        validated_data.pop("quero_apresentar", None)
        tags = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if tags is not None:
            instance.tags.set(tags)

        instance.save()
        return instance
