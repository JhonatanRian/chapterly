from rest_framework.serializers import DateTimeField, Serializer, ValidationError


class RescheduleSerializer(Serializer):
    data_agendada = DateTimeField(
        required=True,
        help_text="Data e hora da apresentação no formato ISO 8601",
    )

    def validate_data_agendada(self, value):
        from django.utils import timezone

        if value < timezone.now():
            raise ValidationError("A data da apresentação deve ser no futuro.")
        return value
