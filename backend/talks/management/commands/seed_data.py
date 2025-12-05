import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from talks.models import Comment, Idea, Notification, Tag, Vote

User = get_user_model()


class Command(BaseCommand):
    help = "Popula o banco de dados com dados de exemplo"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Limpa dados existentes antes de popular",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("Limpando dados existentes..."))
            Comment.objects.all().delete()
            Vote.objects.all().delete()
            Notification.objects.all().delete()
            Idea.objects.all().delete()
            Tag.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()
            self.stdout.write(self.style.SUCCESS("✓ Dados limpos"))

        self.stdout.write(self.style.SUCCESS("Criando dados de exemplo..."))

        # 1. Criar usuários
        self.stdout.write("\n[1/5] Criando usuários...")
        users = self.create_users()
        self.stdout.write(self.style.SUCCESS(f"✓ {len(users)} usuários criados"))

        # 2. Criar tags
        self.stdout.write("\n[2/5] Criando tags...")
        tags = self.create_tags()
        self.stdout.write(self.style.SUCCESS(f"✓ {len(tags)} tags criadas"))

        # 3. Criar ideias
        self.stdout.write("\n[3/5] Criando ideias...")
        ideas = self.create_ideas(users, tags)
        self.stdout.write(self.style.SUCCESS(f"✓ {len(ideas)} ideias criadas"))

        # 4. Criar votos
        self.stdout.write("\n[4/5] Criando votos...")
        votes_count = self.create_votes(users, ideas)
        self.stdout.write(self.style.SUCCESS(f"✓ {votes_count} votos criados"))

        # 5. Criar comentários
        self.stdout.write("\n[5/5] Criando comentários...")
        comments_count = self.create_comments(users, ideas)
        self.stdout.write(self.style.SUCCESS(f"✓ {comments_count} comentários criados"))

        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.SUCCESS("✅ Banco de dados populado com sucesso!"))
        self.stdout.write("=" * 70)
        self.stdout.write("\n📊 Resumo:")
        self.stdout.write(f"   • {len(users)} usuários")
        self.stdout.write(f"   • {len(tags)} tags")
        self.stdout.write(f"   • {len(ideas)} ideias")
        self.stdout.write(f"   • {votes_count} votos")
        self.stdout.write(f"   • {comments_count} comentários")
        self.stdout.write("\n🚀 Acesse: http://localhost:8000/api/ideas/")
        self.stdout.write("📚 Swagger: http://localhost:8000/api/docs/")
        self.stdout.write("=" * 70 + "\n")

    def create_users(self):
        """Cria usuários de exemplo"""
        users_data = [
            {
                "username": "maria_silva",
                "email": "maria@chapterly.local",
                "first_name": "Maria",
                "last_name": "Silva",
            },
            {
                "username": "joao_santos",
                "email": "joao@chapterly.local",
                "first_name": "João",
                "last_name": "Santos",
            },
            {
                "username": "ana_costa",
                "email": "ana@chapterly.local",
                "first_name": "Ana",
                "last_name": "Costa",
            },
            {
                "username": "pedro_oliveira",
                "email": "pedro@chapterly.local",
                "first_name": "Pedro",
                "last_name": "Oliveira",
            },
            {
                "username": "carla_rodrigues",
                "email": "carla@chapterly.local",
                "first_name": "Carla",
                "last_name": "Rodrigues",
            },
        ]

        users = []
        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data["username"], defaults=data
            )
            if created:
                user.set_password("senha123")
                user.save()
            users.append(user)

        return users

    def create_tags(self):
        """Cria tags de exemplo"""
        tags_data = [
            ("Python", "#3776AB"),
            ("Django", "#092E20"),
            ("React", "#61DAFB"),
            ("TypeScript", "#3178C6"),
            ("PostgreSQL", "#336791"),
            ("Docker", "#2496ED"),
            ("API", "#FF6B00"),
            ("Performance", "#10B981"),
            ("Segurança", "#EF4444"),
            ("Testes", "#F59E0B"),
        ]

        tags = []
        for nome, cor in tags_data:
            tag, _ = Tag.objects.get_or_create(nome=nome, defaults={"cor": cor})
            tags.append(tag)

        return tags

    def create_ideas(self, users, tags):
        """Cria ideias de exemplo"""
        ideas_data = [
            {
                "titulo": "Clean Architecture no Django",
                "descricao": "Como aplicar princípios de Clean Architecture em projetos Django para melhor manutenibilidade",
                "conteudo": "<h2>Introdução</h2><p>Clean Architecture é um padrão de design que separa as preocupações em camadas concêntricas...</p><h3>Benefícios</h3><ul><li>Testabilidade</li><li>Independência de frameworks</li><li>Manutenibilidade</li></ul>",
                "status": "pendente",
                "prioridade": "alta",
                "tags_names": ["Python", "Django"],
            },
            {
                "titulo": "React Hooks Avançados",
                "descricao": "Explorando hooks customizados e padrões avançados no React",
                "conteudo": "<h2>Hooks Customizados</h2><p>Criar seus próprios hooks pode simplificar muito a lógica de componentes...</p><code>const useLocalStorage = (key, initialValue) => { ... }</code>",
                "status": "agendado",
                "prioridade": "media",
                "data_agendada": timezone.now() + timedelta(days=7),
                "tags_names": ["React", "TypeScript"],
            },
            {
                "titulo": "Otimização de Queries no PostgreSQL",
                "descricao": "Técnicas para melhorar performance de queries complexas",
                "conteudo": "<h2>Índices</h2><p>Os índices são fundamentais para performance...</p><h3>Tipos de Índices</h3><ul><li>B-tree</li><li>Hash</li><li>GiST</li></ul>",
                "status": "concluido",
                "prioridade": "baixa",
                "data_agendada": timezone.now() - timedelta(days=15),
                "tags_names": ["PostgreSQL", "Performance"],
            },
            {
                "titulo": "Docker Multi-Stage Builds",
                "descricao": "Como reduzir o tamanho das imagens Docker usando multi-stage builds",
                "conteudo": "<h2>Multi-Stage Builds</h2><p>Permite criar imagens menores e mais seguras...</p><pre>FROM node:20 AS builder\n...</pre>",
                "status": "agendado",
                "prioridade": "media",
                "data_agendada": timezone.now() + timedelta(days=14),
                "tags_names": ["Docker"],
            },
            {
                "titulo": "JWT vs Session Authentication",
                "descricao": "Comparação entre autenticação com JWT e sessions tradicionais",
                "conteudo": "<h2>JWT</h2><p>Stateless, escalável...</p><h2>Sessions</h2><p>Stateful, mais seguro por padrão...</p>",
                "status": "pendente",
                "prioridade": "alta",
                "tags_names": ["API", "Segurança"],
            },
            {
                "titulo": "Testes End-to-End com Playwright",
                "descricao": "Como implementar testes E2E robustos usando Playwright",
                "conteudo": "<h2>Playwright</h2><p>Framework moderno para testes E2E...</p><code>await page.goto('/');</code>",
                "status": "pendente",
                "prioridade": "media",
                "tags_names": ["Testes", "TypeScript"],
            },
            {
                "titulo": "GraphQL vs REST API",
                "descricao": "Quando usar GraphQL e quando usar REST?",
                "conteudo": "<h2>GraphQL</h2><p>Flexibilidade nas queries...</p><h2>REST</h2><p>Simplicidade e padronização...</p>",
                "status": "agendado",
                "prioridade": "baixa",
                "data_agendada": timezone.now() + timedelta(days=21),
                "tags_names": ["API"],
            },
            {
                "titulo": "Type Safety no TypeScript",
                "descricao": "Aproveitar ao máximo o sistema de tipos do TypeScript",
                "conteudo": "<h2>Generics</h2><p>Tipos reutilizáveis...</p><h3>Utility Types</h3><ul><li>Partial</li><li>Pick</li><li>Omit</li></ul>",
                "status": "pendente",
                "prioridade": "media",
                "tags_names": ["TypeScript"],
            },
            {
                "titulo": "Migrações de Schema no Django",
                "descricao": "Boas práticas para gerenciar migrações em produção",
                "conteudo": "<h2>Migrações</h2><p>Como lidar com mudanças de schema sem downtime...</p>",
                "status": "concluido",
                "prioridade": "baixa",
                "data_agendada": timezone.now() - timedelta(days=30),
                "tags_names": ["Django", "PostgreSQL"],
            },
            {
                "titulo": "React Server Components",
                "descricao": "Entendendo os novos Server Components do React",
                "conteudo": "<h2>RSC</h2><p>Nova forma de renderizar componentes no servidor...</p>",
                "status": "pendente",
                "prioridade": "alta",
                "tags_names": ["React"],
            },
            {
                "titulo": "Segurança em APIs REST",
                "descricao": "Principais vulnerabilidades e como proteger suas APIs",
                "conteudo": "<h2>OWASP Top 10</h2><p>SQL Injection, XSS, CSRF...</p><h3>Proteções</h3><ul><li>Rate limiting</li><li>Input validation</li></ul>",
                "status": "pendente",
                "prioridade": "alta",
                "tags_names": ["API", "Segurança"],
            },
            {
                "titulo": "Python Async/Await",
                "descricao": "Programação assíncrona em Python com asyncio",
                "conteudo": "<h2>AsyncIO</h2><p>Como escrever código assíncrono em Python...</p><code>async def fetch(): ...</code>",
                "status": "agendado",
                "prioridade": "media",
                "data_agendada": timezone.now() + timedelta(days=28),
                "tags_names": ["Python", "Performance"],
            },
            {
                "titulo": "CI/CD com GitHub Actions",
                "descricao": "Automatizando deploy com GitHub Actions",
                "conteudo": "<h2>GitHub Actions</h2><p>Pipeline de CI/CD...</p><pre>name: Deploy\non: [push]</pre>",
                "status": "pendente",
                "prioridade": "baixa",
                "tags_names": ["Docker"],
            },
            {
                "titulo": "Monitoramento com Sentry",
                "descricao": "Como integrar e usar Sentry para monitorar erros",
                "conteudo": "<h2>Sentry</h2><p>Captura e análise de erros em produção...</p>",
                "status": "concluido",
                "prioridade": "media",
                "data_agendada": timezone.now() - timedelta(days=10),
                "tags_names": ["Python", "Django"],
            },
            {
                "titulo": "Cache Strategies com Redis",
                "descricao": "Diferentes estratégias de cache usando Redis",
                "conteudo": "<h2>Cache Patterns</h2><p>Cache-aside, Write-through, Write-behind...</p>",
                "status": "pendente",
                "prioridade": "media",
                "tags_names": ["Performance"],
            },
        ]

        ideas = []
        for i, data in enumerate(ideas_data):
            tags_names = data.pop("tags_names", [])
            autor = users[i % len(users)]

            # Algumas ideias têm apresentador, outras não
            apresentador = None
            if data["status"] in ["agendado", "concluido"]:
                apresentador = users[(i + 1) % len(users)]

            idea, created = Idea.objects.get_or_create(
                titulo=data["titulo"],
                defaults={
                    **data,
                    "autor": autor,
                    "apresentador": apresentador,
                },
            )

            if created:
                # Adicionar tags
                for tag_name in tags_names:
                    tag = Tag.objects.filter(nome=tag_name).first()
                    if tag:
                        idea.tags.add(tag)

            ideas.append(idea)

        return ideas

    def create_votes(self, users, ideas):
        """Cria votos aleatórios"""
        votes_count = 0

        for idea in ideas:
            # Número aleatório de votos (0 a 5)
            num_votes = random.randint(0, min(5, len(users)))
            voters = random.sample(users, num_votes)

            for voter in voters:
                # Não votar na própria ideia
                if voter != idea.autor:
                    _, created = Vote.objects.get_or_create(user=voter, idea=idea)
                    if created:
                        votes_count += 1

        return votes_count

    def create_comments(self, users, ideas):
        """Cria comentários aleatórios"""
        comments_templates = [
            "Ótima ideia! Estou ansioso para essa apresentação.",
            "Muito interessante, seria legal abordar também {topic}.",
            "Concordo totalmente! Este tema é muito relevante.",
            "Já trabalhei com isso e recomendo muito.",
            "Excelente escolha de tema!",
            "Poderia incluir exemplos práticos?",
            "Esse assunto está muito em alta!",
            "Tenho algumas dúvidas sobre {topic}, será abordado?",
            "Legal! Quando vai ser agendado?",
            "Vou comparecer com certeza!",
        ]

        topics = [
            "deployment",
            "testes",
            "performance",
            "segurança",
            "boas práticas",
            "casos de uso",
        ]

        comments_count = 0

        # Comentar em ~40% das ideias
        ideas_to_comment = random.sample(ideas, int(len(ideas) * 0.4))

        for idea in ideas_to_comment:
            num_comments = random.randint(1, 4)

            for _ in range(num_comments):
                commenter = random.choice(users)
                template = random.choice(comments_templates)

                # Substituir placeholder se existir
                if "{topic}" in template:
                    template = template.replace("{topic}", random.choice(topics))

                _, created = Comment.objects.get_or_create(
                    user=commenter,
                    idea=idea,
                    conteudo=template,
                    defaults={"parent": None},
                )

                if created:
                    comments_count += 1

        return comments_count
