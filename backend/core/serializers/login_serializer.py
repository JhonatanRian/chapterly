from django.contrib.auth import authenticate
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
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
