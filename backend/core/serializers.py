from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários"""

    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        """Valida se o email é único"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate_username(self, value):
        """Valida se o username é único"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username já está em uso.")
        return value

    def validate(self, attrs):
        """Valida se as senhas são iguais"""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "As senhas não coincidem."}
            )

        # Validação de tamanho mínimo
        if len(attrs["password"]) < 8:
            raise serializers.ValidationError(
                {"password": "A senha deve ter pelo menos 8 caracteres."}
            )

        return attrs

    def create(self, validated_data):
        """Cria um novo usuário"""
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuários"""

    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        """Valida as credenciais do usuário"""
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError(
                    "Não foi possível fazer login com as credenciais fornecidas."
                )

            if not user.is_active:
                raise serializers.ValidationError("Esta conta está desativada.")

            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Deve incluir 'username' e 'password'.")


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil do usuário com estatísticas"""

    ideias_criadas_count = serializers.IntegerField(
        source="ideias_criadas.count", read_only=True
    )
    apresentacoes_count = serializers.IntegerField(
        source="ideias_apresentando.count", read_only=True
    )
    votos_count = serializers.IntegerField(source="votos.count", read_only=True)

    # Ideias recentes
    ideias_criadas = serializers.SerializerMethodField()
    ideias_apresentando = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "ideias_criadas_count",
            "apresentacoes_count",
            "votos_count",
            "ideias_criadas",
            "ideias_apresentando",
        ]
        read_only_fields = ["id", "username", "date_joined"]

    def get_ideias_criadas(self, obj):
        """Retorna as 5 últimas ideias criadas"""
        from talks.serializers import IdeaListSerializer

        ideias = obj.ideias_criadas.all().order_by("-created_at")[:5]
        return IdeaListSerializer(ideias, many=True, context=self.context).data

    def get_ideias_apresentando(self, obj):
        """Retorna as 5 últimas apresentações"""
        from talks.serializers import IdeaListSerializer

        ideias = obj.ideias_apresentando.all().order_by("-created_at")[:5]
        return IdeaListSerializer(ideias, many=True, context=self.context).data


class TokenResponseSerializer(serializers.Serializer):
    """Serializer para resposta com tokens e dados do usuário"""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para mudança de senha"""

    old_password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    new_password_confirm = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        """Valida se a senha antiga está correta"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate(self, attrs):
        """Valida se as novas senhas são iguais"""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "As senhas não coincidem."}
            )

        # Validação de tamanho mínimo
        if len(attrs["new_password"]) < 8:
            raise serializers.ValidationError(
                {"new_password": "A senha deve ter pelo menos 8 caracteres."}
            )

        return attrs

    def save(self, **kwargs):
        """Salva a nova senha"""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
