from rest_framework import serializers
from talks.models import Retro, RetroTemplate
from talks.serializers.retro_item_serializer import RetroItemSerializer
from talks.serializers.retro_template_serializer import RetroTemplateSerializer
from core.serializers import UserProfileSerializer


class RetroListSerializer(serializers.ModelSerializer):
    autor = UserProfileSerializer(read_only=True)
    template_nome = serializers.CharField(source="template.nome", read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_participantes = serializers.IntegerField(read_only=True)
    total_votos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Retro
        fields = [
            "id",
            "titulo",
            "descricao",
            "data",
            "status",
            "template",
            "template_nome",
            "autor",
            "total_items",
            "total_participantes",
            "total_votos",
            "created_at",
            "updated_at",
        ]


class RetroDetailSerializer(serializers.ModelSerializer):
    autor = UserProfileSerializer(read_only=True)
    template = RetroTemplateSerializer(read_only=True)
    participantes = UserProfileSerializer(many=True, read_only=True)
    items = RetroItemSerializer(many=True, read_only=True)

    total_participantes = serializers.IntegerField(read_only=True)
    total_votos = serializers.IntegerField(read_only=True)
    is_participante = serializers.SerializerMethodField()

    class Meta:
        model = Retro
        fields = [
            "id",
            "titulo",
            "descricao",
            "data",
            "status",
            "template",
            "autor",
            "participantes",
            "items",
            "total_items",
            "total_participantes",
            "total_votos",
            "is_participante",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "autor", "total_items", "created_at", "updated_at"]

    def get_is_participante(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.participantes.filter(id=request.user.id).exists()
        return False


class RetroCreateUpdateSerializer(serializers.ModelSerializer):
    participantes_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="IDs dos participantes",
    )

    class Meta:
        model = Retro
        fields = [
            "titulo",
            "descricao",
            "data",
            "status",
            "template",
            "participantes_ids",
        ]

    def validate_template(self, value):
        if not RetroTemplate.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Template não encontrado.")
        return value

    def create(self, validated_data):
        participantes_ids = validated_data.pop("participantes_ids", [])
        retro = Retro.objects.create(**validated_data)

        if participantes_ids:
            from core.models import User

            participantes = User.objects.filter(id__in=participantes_ids)
            retro.participantes.set(participantes)

        return retro

    def update(self, instance, validated_data):
        participantes_ids = validated_data.pop("participantes_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if participantes_ids is not None:
            from core.models import User

            participantes = User.objects.filter(id__in=participantes_ids)
            instance.participantes.set(participantes)

        return instance
