from django.core.management.base import BaseCommand
from talks.models import RetroTemplate


class Command(BaseCommand):
    help = "Cria templates padrão de retrospectiva"

    def handle(self, *args, **kwargs):
        templates_data = [
            {
                "nome": "Start/Stop/Continue",
                "descricao": "Template clássico focado em ações: o que começar a fazer, o que parar de fazer, e o que continuar fazendo.",
                "categorias": [
                    {
                        "name": "Start (Começar)",
                        "slug": "start",
                        "icon": "🚀",
                        "color": "#10b981",
                    },
                    {
                        "name": "Stop (Parar)",
                        "slug": "stop",
                        "icon": "🛑",
                        "color": "#ef4444",
                    },
                    {
                        "name": "Continue (Continuar)",
                        "slug": "continue",
                        "icon": "✅",
                        "color": "#3b82f6",
                    },
                ],
                "is_default": True,
                "is_system": True,
            },
            {
                "nome": "Mad/Sad/Glad",
                "descricao": "Template focado em sentimentos da equipe sobre o sprint.",
                "categorias": [
                    {
                        "name": "Mad (Irritado)",
                        "slug": "mad",
                        "icon": "😠",
                        "color": "#ef4444",
                    },
                    {
                        "name": "Sad (Triste)",
                        "slug": "sad",
                        "icon": "😢",
                        "color": "#f59e0b",
                    },
                    {
                        "name": "Glad (Feliz)",
                        "slug": "glad",
                        "icon": "😊",
                        "color": "#10b981",
                    },
                ],
                "is_default": False,
                "is_system": True,
            },
            {
                "nome": "What Went Well / To Improve / Action Items",
                "descricao": "Template estruturado para identificar sucessos, pontos de melhoria e planos de ação.",
                "categorias": [
                    {
                        "name": "What went well (O que deu certo)",
                        "slug": "went_well",
                        "icon": "👍",
                        "color": "#10b981",
                    },
                    {
                        "name": "To improve (A melhorar)",
                        "slug": "to_improve",
                        "icon": "🔧",
                        "color": "#f59e0b",
                    },
                    {
                        "name": "Action items (Ações)",
                        "slug": "action_items",
                        "icon": "📋",
                        "color": "#3b82f6",
                    },
                ],
                "is_default": False,
                "is_system": True,
            },
            {
                "nome": "4Ls (Liked/Learned/Lacked/Longed For)",
                "descricao": "Template para refletir sobre o que foi gostado, aprendido, o que faltou e o que foi desejado.",
                "categorias": [
                    {
                        "name": "Liked (Gostei)",
                        "slug": "liked",
                        "icon": "❤️",
                        "color": "#ec4899",
                    },
                    {
                        "name": "Learned (Aprendi)",
                        "slug": "learned",
                        "icon": "📚",
                        "color": "#8b5cf6",
                    },
                    {
                        "name": "Lacked (Faltou)",
                        "slug": "lacked",
                        "icon": "❌",
                        "color": "#f59e0b",
                    },
                    {
                        "name": "Longed For (Desejei)",
                        "slug": "longed_for",
                        "icon": "💭",
                        "color": "#06b6d4",
                    },
                ],
                "is_default": False,
                "is_system": True,
            },
        ]

        created_count = 0
        updated_count = 0

        for template_data in templates_data:
            template, created = RetroTemplate.objects.update_or_create(
                nome=template_data["nome"],
                defaults={
                    "descricao": template_data["descricao"],
                    "categorias": template_data["categorias"],
                    "is_default": template_data["is_default"],
                    "is_system": template_data["is_system"],
                },
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Template "{template.nome}" criado')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⟳ Template "{template.nome}" atualizado')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Concluído! {created_count} templates criados, {updated_count} atualizados."
            )
        )
