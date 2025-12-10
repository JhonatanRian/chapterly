"""
Comando para popular o banco com dados de teste simulando 10 anos de chapters.

Usage:
    python manage.py seed_timeline --years 10
    python manage.py seed_timeline --years 5 --per-week 3
    python manage.py seed_timeline --clear  # Limpa dados existentes
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from talks.models import Idea, Tag, Vote

User = get_user_model()


class Command(BaseCommand):
    help = "Popula o banco com dados de teste para timeline de chapters"

    def add_arguments(self, parser):
        parser.add_argument(
            "--years",
            type=int,
            default=10,
            help="Número de anos de histórico para criar (padrão: 10)",
        )
        parser.add_argument(
            "--per-week",
            type=int,
            default=2,
            help="Número de apresentações por semana (padrão: 2)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Limpar todas as ideias antes de criar novas",
        )
        parser.add_argument(
            "--no-votes",
            action="store_true",
            help="Não criar votos aleatórios",
        )

    def handle(self, *args, **options):
        years = options["years"]
        per_week = options["per_week"]
        clear = options["clear"]
        create_votes = not options["no_votes"]

        if clear:
            self.stdout.write(self.style.WARNING("Limpando dados existentes..."))
            Idea.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Dados limpos"))

        # Criar usuários de teste se não existirem
        users = self._get_or_create_users()
        tags = self._get_or_create_tags()

        # Calcular período
        now = timezone.now()
        start_date = now - timedelta(days=years * 365)
        total_weeks = years * 52
        total_ideas = total_weeks * per_week

        self.stdout.write(
            self.style.SUCCESS(
                f"\n📅 Criando {total_ideas} apresentações "
                f"({years} anos × {per_week}/semana)...\n"
            )
        )

        # Criar apresentações
        ideas_created = 0
        current_date = start_date

        # Começar na próxima terça-feira 19h (padrão de chapters)
        while current_date.weekday() != 1:  # 1 = terça-feira
            current_date += timedelta(days=1)
        current_date = current_date.replace(hour=19, minute=0, second=0, microsecond=0)

        for week in range(total_weeks):
            # Criar apresentações para esta semana
            for i in range(per_week):
                idea = self._create_idea(
                    current_date,
                    users,
                    tags,
                    week_number=week + 1,
                    idea_in_week=i + 1,
                )

                # Criar votos aleatórios
                if create_votes and idea:
                    self._create_votes(idea, users)

                ideas_created += 1

                # Avançar para próximo horário (ex: 19h, 19:30h, 20h...)
                current_date += timedelta(minutes=30)

            # Próxima semana (voltar para terça 19h)
            days_until_next_week = 7 - (current_date.weekday() - 1)
            current_date += timedelta(days=days_until_next_week)
            current_date = current_date.replace(hour=19, minute=0)

            # Progress
            if (week + 1) % 52 == 0:
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Ano {(week + 1) // 52} completo")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Criadas {ideas_created} apresentações com sucesso!"
            )
        )

        # Estatísticas
        self._show_stats()

    def _get_or_create_users(self):
        """Cria ou retorna usuários de teste"""
        users = []

        # Usuário admin
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@chapterly.com",
                "first_name": "Admin",
                "last_name": "Chapterly",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  ✓ Usuário admin criado"))
        users.append(admin)

        # Usuários teste
        test_users = [
            ("joao.silva", "João", "Silva"),
            ("maria.santos", "Maria", "Santos"),
            ("pedro.oliveira", "Pedro", "Oliveira"),
            ("ana.costa", "Ana", "Costa"),
            ("lucas.pereira", "Lucas", "Pereira"),
            ("juliana.alves", "Juliana", "Alves"),
            ("rafael.souza", "Rafael", "Souza"),
            ("camila.lima", "Camila", "Lima"),
        ]

        for username, first_name, last_name in test_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@chapterly.com",
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            if created:
                user.set_password("senha123")
                user.save()
            users.append(user)

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(users)} usuários disponíveis"))
        return users

    def _get_or_create_tags(self):
        """Cria ou retorna tags de teste"""
        tag_names = [
            "Python",
            "Django",
            "React",
            "TypeScript",
            "AWS",
            "DevOps",
            "Machine Learning",
            "Frontend",
            "Backend",
            "Mobile",
            "Design",
            "UX/UI",
            "Arquitetura",
            "Testes",
            "Performance",
            "Segurança",
            "API",
            "Database",
        ]

        tags = []
        for name in tag_names:
            tag, created = Tag.objects.get_or_create(nome=name)
            tags.append(tag)

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(tags)} tags disponíveis"))
        return tags

    def _create_idea(self, date, users, tags, week_number, idea_in_week):
        """Cria uma ideia/apresentação"""
        topics = [
            "Introdução",
            "Melhores práticas",
            "Como implementar",
            "Deep dive",
            "Case study",
            "Dicas e truques",
            "O que há de novo",
            "Tutorial prático",
            "Arquitetura de",
            "Performance em",
            "Segurança em",
            "Deploy de",
            "Testando",
            "Monitorando",
            "Otimizando",
        ]

        # Escolher tag aleatória
        tag = random.choice(tags)
        topic = random.choice(topics)

        titulo = f"{topic} {tag.nome}"
        descricao = (
            f"Apresentação sobre {tag.nome} realizada na semana {week_number}. "
            f"Vamos explorar conceitos importantes, melhores práticas e exemplos práticos."
        )
        conteudo = f"""
# {titulo}

## Objetivo
Compartilhar conhecimento sobre {tag.nome} com o time.

## Tópicos
- Conceitos fundamentais
- Casos de uso
- Exemplos práticos
- Q&A

## Recursos
- Slides
- Código de exemplo
- Documentação

Apresentação #{week_number * 10 + idea_in_week}
        """.strip()

        # Escolher autor e apresentador aleatórios
        autor = random.choice(users)
        apresentador = random.choice(users)

        # Prioridade aleatória
        prioridade = random.choice(["baixa", "media", "alta"])

        try:
            idea = Idea.objects.create(
                titulo=titulo,
                descricao=descricao,
                conteudo=conteudo,
                autor=autor,
                apresentador=apresentador,
                data_agendada=date,
                prioridade=prioridade,
            )

            # Adicionar tags (1-3 tags aleatórias)
            num_tags = random.randint(1, min(3, len(tags)))
            selected_tags = random.sample(tags, num_tags)
            idea.tags.set(selected_tags)

            return idea

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erro ao criar ideia: {e}"))
            return None

    def _create_votes(self, idea, users):
        """Cria votos aleatórios para uma ideia"""
        # 30-70% dos usuários votam em cada apresentação
        vote_percentage = random.uniform(0.3, 0.7)
        num_voters = int(len(users) * vote_percentage)

        voters = random.sample(users, num_voters)
        for voter in voters:
            Vote.objects.get_or_create(usuario=voter, ideia=idea)

    def _show_stats(self):
        """Mostra estatísticas dos dados criados"""
        now = timezone.now()

        total = Idea.objects.filter(data_agendada__isnull=False).count()
        agendado = Idea.objects.filter(data_agendada__gt=now).count()
        concluido = Idea.objects.filter(data_agendada__lte=now).count()

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("📊 ESTATÍSTICAS"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"Total de apresentações: {total}")
        self.stdout.write(f"  🔵 Agendadas (futuro): {agendado}")
        self.stdout.write(f"  ✅ Concluídas (passado): {concluido}")
        self.stdout.write("")

        # Usuários
        users_count = User.objects.count()
        self.stdout.write(f"Total de usuários: {users_count}")

        # Tags
        tags_count = Tag.objects.count()
        self.stdout.write(f"Total de tags: {tags_count}")

        # Votos
        votes_count = Vote.objects.count()
        avg_votes = votes_count / total if total > 0 else 0
        self.stdout.write(
            f"Total de votos: {votes_count} (média: {avg_votes:.1f}/apresentação)"
        )

        self.stdout.write("=" * 50 + "\n")
