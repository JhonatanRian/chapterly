from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment, Idea, Notification, Tag, Vote

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para usuários"""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer de usuário com estatísticas"""

    ideias_criadas_count = serializers.IntegerField(
        source="ideias_criadas.count", read_only=True
    )
    apresentacoes_count = serializers.IntegerField(
        source="ideias_apresentando.count", read_only=True
    )
    votos_count = serializers.IntegerField(source="votos.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "ideias_criadas_count",
            "apresentacoes_count",
            "votos_count",
        ]
        read_only_fields = ["id"]


class TagSerializer(serializers.ModelSerializer):
    """Serializer para tags"""

    class Meta:
        model = Tag
        fields = ["id", "nome", "cor", "slug", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]


class VoteSerializer(serializers.ModelSerializer):
    """Serializer para votos"""

    user = UserSerializer(read_only=True)

    class Meta:
        model = Vote
        fields = ["id", "user", "idea", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    """Serializer para comentários"""

    user = UserSerializer(read_only=True)
    respostas = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "user",
            "idea",
            "conteudo",
            "parent",
            "respostas",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_respostas(self, obj):
        """Retorna respostas (comentários filhos)"""
        if obj.respostas.exists():
            return CommentSerializer(obj.respostas.all(), many=True).data
        return []


class IdeaListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem de ideias"""

    autor = UserSerializer(read_only=True)
    apresentador = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    vote_count = serializers.IntegerField(source="votos.count", read_only=True)
    has_voted = serializers.SerializerMethodField()
    precisa_apresentador = serializers.BooleanField(read_only=True)

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
            "has_voted",
            "precisa_apresentador",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_has_voted(self, obj):
        """Verifica se o usuário atual votou nesta ideia"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, idea=obj).exists()
        return False


class IdeaDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes da ideia"""

    autor = UserSerializer(read_only=True)
    apresentador = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    votos = VoteSerializer(many=True, read_only=True)
    comentarios = serializers.SerializerMethodField()
    vote_count = serializers.IntegerField(source="votos.count", read_only=True)
    has_voted = serializers.SerializerMethodField()
    precisa_apresentador = serializers.BooleanField(read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_presenter = serializers.SerializerMethodField()

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
            "has_voted",
            "precisa_apresentador",
            "is_owner",
            "is_presenter",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_comentarios(self, obj):
        """Retorna apenas comentários raiz (sem parent)"""
        comentarios_raiz = obj.comentarios.filter(parent__isnull=True)
        return CommentSerializer(comentarios_raiz, many=True).data

    def get_has_voted(self, obj):
        """Verifica se o usuário atual votou nesta ideia"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, idea=obj).exists()
        return False

    def get_is_owner(self, obj):
        """Verifica se o usuário atual é o autor"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.autor == request.user
        return False

    def get_is_presenter(self, obj):
        """Verifica se o usuário atual é o apresentador"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.apresentador == request.user
        return False


class IdeaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criar/editar ideias"""

    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )
    quero_apresentar = serializers.BooleanField(write_only=True, required=False)

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
        """Valida o título"""
        if len(value) < 5:
            raise serializers.ValidationError(
                "O título deve ter pelo menos 5 caracteres."
            )
        return value

    def validate_descricao(self, value):
        """Valida a descrição"""
        if len(value) < 10:
            raise serializers.ValidationError(
                "A descrição deve ter pelo menos 10 caracteres."
            )
        return value

    def validate_imagem(self, value):
        """Valida o tamanho da imagem"""
        if value and value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError("A imagem não pode ter mais de 5MB.")
        return value

    def create(self, validated_data):
        """Cria uma nova ideia"""
        quero_apresentar = validated_data.pop("quero_apresentar", False)
        tags = validated_data.pop("tags", [])

        # Autor é o usuário autenticado
        validated_data["autor"] = self.context["request"].user

        # Se marcou "quero apresentar", define como apresentador
        if quero_apresentar:
            validated_data["apresentador"] = self.context["request"].user

        idea = Idea.objects.create(**validated_data)

        # Adiciona tags
        if tags:
            idea.tags.set(tags)

        return idea

    def update(self, instance, validated_data):
        """Atualiza uma ideia existente"""
        quero_apresentar = validated_data.pop("quero_apresentar", None)
        tags = validated_data.pop("tags", None)

        # Atualiza campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Atualiza tags se fornecidas
        if tags is not None:
            instance.tags.set(tags)

        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificações"""

    idea = IdeaListSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "tipo",
            "mensagem",
            "idea",
            "lido",
            "created_at",
        ]
        read_only_fields = ["id", "tipo", "mensagem", "idea", "created_at"]
