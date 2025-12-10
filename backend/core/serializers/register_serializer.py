from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer, CharField, ValidationError

User = get_user_model()


class RegisterSerializer(ModelSerializer):
    password = CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    password_confirm = CharField(
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
        if User.objects.filter(email=value).exists():
            raise ValidationError("Este email já está cadastrado.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise ValidationError("Este username já está em uso.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise ValidationError(
                {"password_confirm": "As senhas não coincidem."}
            )

        if len(attrs["password"]) < 8:
            raise ValidationError(
                {"password": "A senha deve ter pelo menos 8 caracteres."}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user
