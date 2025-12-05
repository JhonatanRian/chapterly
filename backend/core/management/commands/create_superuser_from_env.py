import environ
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

env = environ.Env()


class Command(BaseCommand):
    help = "Cria um superuser a partir de variáveis de ambiente se não existir"

    def handle(self, *args, **options):
        username = env("DJANGO_SUPERUSER_USERNAME", default="admin")
        email = env("DJANGO_SUPERUSER_EMAIL", default="admin@example.com")
        password = env("DJANGO_SUPERUSER_PASSWORD", default="admin123")

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Superuser "{username}" já existe. Pulando criação.'
                )
            )
            return

        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser "{username}" criado com sucesso!\n'
                    f"Email: {email}\n"
                    f"Senha: {'*' * len(password)}"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro ao criar superuser: {str(e)}"))
