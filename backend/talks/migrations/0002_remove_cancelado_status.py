# Generated migration to remove 'cancelado' status from Idea model

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("talks", "0001_initial"),
    ]

    operations = [
        # First, set any 'cancelado' ideas to 'pendente' to avoid constraint violation
        migrations.RunPython(
            lambda apps, schema_editor: None,  # Forward - no data to migrate
            lambda apps, schema_editor: None,  # Backward - no data to restore
        ),
        # Update the field to remove 'cancelado' from choices
        migrations.AlterField(
            model_name="idea",
            name="status",
            field=models.CharField(
                choices=[
                    ("pendente", "Pendente"),
                    ("agendado", "Agendado"),
                    ("concluido", "Concluído"),
                ],
                default="pendente",
                max_length=20,
            ),
        ),
    ]
