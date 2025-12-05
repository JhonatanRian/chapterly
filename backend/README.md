# Chapterly Backend - API REST

Backend Django com API REST completa para gerenciar apresentações em chapters de backend.

## 🚀 Tecnologias

- **Python 3.14+**
- **Django 6.0**
- **Django REST Framework 3.16**
- **PostgreSQL** (produção) / **SQLite** (desenvolvimento)
- **JWT** (autenticação)
- **django-filter** (filtros avançados)
- **drf-spectacular** (documentação OpenAPI/Swagger)
- **Pillow** (upload de imagens)

---

## 📋 Pré-requisitos

- Python 3.14+
- PostgreSQL (opcional, para produção)
- Redis (opcional, para cache futuro)

---

## 🔧 Instalação

### 1. Instalar dependências

```bash
# Na raiz do projeto (chapterly/)
uv sync
```

### 2. Configurar variáveis de ambiente

```bash
# Criar arquivo .env no diretório backend/
cp backend/.env.example backend/.env
```

Editar `backend/.env` conforme necessário:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite para dev, PostgreSQL para produção)
DATABASE_URL=sqlite:///db.sqlite3
# DATABASE_URL=postgresql://user:password@localhost:5432/chapterly_db

# Company Settings
COMPANY_NAME=Chapterly

# Superuser
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@chapterly.local
DJANGO_SUPERUSER_PASSWORD=admin123

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Rodar migrations

```bash
cd backend
python manage.py migrate
```

### 4. Criar superuser

```bash
python manage.py create_superuser_from_env
```

### 5. (Opcional) Popular com dados de exemplo

```bash
python manage.py seed_data

# Ou limpar e recriar dados:
python manage.py seed_data --clear
```

---

## 🏃 Executar

```bash
cd backend
python manage.py runserver
```

Servidor rodando em: **http://localhost:8000**

---

## 📚 Documentação da API

### Swagger UI (Interativo)
**http://localhost:8000/api/docs/**

### ReDoc (Alternativo)
**http://localhost:8000/api/redoc/**

### Schema OpenAPI (JSON)
**http://localhost:8000/api/schema/**

### Admin Django
**http://localhost:8000/admin/**
- Username: `admin`
- Senha: `admin123` (ou conforme `.env`)

---

## 🛣️ Endpoints Principais

### Autenticação (`/api/auth/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/register/` | Registrar novo usuário |
| POST | `/login/` | Login (retorna JWT tokens) |
| POST | `/logout/` | Logout (blacklist token) |
| POST | `/token/refresh/` | Refresh access token |
| GET/PUT | `/profile/` | Perfil do usuário |
| GET | `/stats/` | Estatísticas do usuário |
| POST | `/change-password/` | Alterar senha |

### Ideias (`/api/ideas/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar ideias (paginado, filtros) |
| POST | `/` | Criar nova ideia |
| GET | `/{id}/` | Detalhes da ideia |
| PUT/PATCH | `/{id}/` | Atualizar ideia |
| DELETE | `/{id}/` | Deletar ideia |
| POST | `/{id}/vote/` | Votar/remover voto |
| POST | `/{id}/volunteer/` | Voluntariar-se |
| DELETE | `/{id}/unvolunteer/` | Remover voluntariado |
| GET | `/upcoming/` | Próximas 5 apresentações |
| GET | `/timeline/` | Timeline completa |
| GET | `/stats/` | Estatísticas gerais |

### Tags (`/api/tags/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar tags |
| GET | `/{id}/` | Detalhes da tag |

### Comentários (`/api/comments/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar comentários (filtrar por `?idea=1`) |
| POST | `/` | Criar comentário |
| DELETE | `/{id}/` | Deletar comentário |

### Notificações (`/api/notifications/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar notificações |
| GET | `/unread/` | Notificações não lidas |
| PATCH | `/{id}/mark_read/` | Marcar como lida |
| POST | `/mark_all_read/` | Marcar todas como lidas |

---

## 🔍 Filtros Avançados

### Ideias (`/api/ideas/`)

**Query Parameters:**

```
?status=pendente,agendado,concluido,cancelado
?prioridade=baixa,media,alta
?autor=1
?autor_username=maria
?apresentador=2
?apresentador_username=joao
?precisa_apresentador=true
?tags=1,2,3
?tags_slug=python
?search=texto_busca
?data_agendada_antes=2025-01-31T23:59:59Z
?data_agendada_depois=2025-01-01T00:00:00Z
?votos_minimos=5
?ordering=-created_at,vote_count,data_agendada
?page=2
```

**Exemplos:**

```bash
# Ideias pendentes que precisam de apresentador
GET /api/ideas/?status=pendente&precisa_apresentador=true

# Ideias sobre Django com alta prioridade
GET /api/ideas/?tags_slug=django&prioridade=alta

# Buscar "performance" com mais de 5 votos
GET /api/ideas/?search=performance&votos_minimos=5

# Ordenar por número de votos
GET /api/ideas/?ordering=-vote_count
```

---

## 🔐 Autenticação

A API usa **JWT (JSON Web Tokens)**.

### 1. Fazer Login

```bash
POST /api/auth/login/
{
  "username": "admin",
  "password": "admin123"
}

# Resposta:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

### 2. Usar o Token

```bash
GET /api/ideas/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 3. Refresh Token

```bash
POST /api/auth/token/refresh/
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Resposta:
{
  "access": "novo_access_token..."
}
```

**Tokens:**
- Access Token: **1 hora** de validade
- Refresh Token: **7 dias** de validade

---

## 📦 Estrutura de Diretórios

```
backend/
├── backend/              # Configurações do projeto
│   ├── settings.py       # Configurações (django-environ)
│   ├── urls.py           # URLs principais
│   └── wsgi.py
├── core/                 # App de autenticação
│   ├── models.py         # User customizado
│   ├── serializers.py    # Serializers de auth
│   ├── views.py          # Views de auth
│   ├── admin.py          # Admin customizado
│   └── management/       # Comandos customizados
│       └── commands/
│           └── create_superuser_from_env.py
├── talks/                # App principal
│   ├── models.py         # Idea, Vote, Tag, Comment, Notification
│   ├── serializers.py    # Serializers da API
│   ├── views.py          # ViewSets
│   ├── permissions.py    # Permissões customizadas
│   ├── filters.py        # Filtros customizados
│   ├── admin.py          # Admin customizado
│   └── management/
│       └── commands/
│           └── seed_data.py  # Popular banco
├── media/                # Uploads (gerado automaticamente)
├── staticfiles/          # Arquivos estáticos (após collectstatic)
├── .env                  # Variáveis de ambiente
├── .env.example          # Exemplo de variáveis
├── manage.py
├── API_DOCUMENTATION.md  # Documentação detalhada
└── README.md             # Este arquivo
```

---

## 🧪 Comandos Úteis

### Migrations

```bash
# Criar migrations
python manage.py makemigrations

# Aplicar migrations
python manage.py migrate

# Ver SQL de uma migration
python manage.py sqlmigrate talks 0001
```

### Superuser

```bash
# Criar via .env
python manage.py create_superuser_from_env

# Criar manualmente
python manage.py createsuperuser
```

### Dados de Teste

```bash
# Popular banco
python manage.py seed_data

# Limpar e popular
python manage.py seed_data --clear
```

### Shell

```bash
# Django shell
python manage.py shell

# Shell Plus (se tiver django-extensions)
python manage.py shell_plus
```

### Static Files

```bash
# Coletar arquivos estáticos
python manage.py collectstatic
```

---

## 🗄️ Models

### User (core)
- Herda de `AbstractUser`
- Campos padrão + relações com ideias e votos

### Idea (talks)
- `titulo`, `descricao`, `conteudo` (HTML)
- `imagem` (upload)
- `autor`, `apresentador` (ForeignKey para User)
- `tags` (ManyToMany)
- `status` (pendente, agendado, concluido, cancelado)
- `prioridade` (baixa, media, alta)
- `data_agendada`

### Vote (talks)
- `user`, `idea` (unique_together)

### Tag (talks)
- `nome`, `cor`, `slug`

### Comment (talks)
- `user`, `idea`, `conteudo`
- `parent` (respostas aninhadas)

### Notification (talks)
- `user`, `tipo`, `mensagem`, `idea`
- `lido` (boolean)

---

## 🔒 Permissões

### IsOwnerOrReadOnly
- Leitura: todos
- Escrita: apenas autor

### IsPresenterOrOwnerOrAdmin
- Autor, apresentador ou admin

### IsAuthenticated
- Apenas usuários autenticados

### IsAuthenticatedOrReadOnly
- Leitura: todos
- Escrita: autenticados

---

## 🌐 CORS

Configurado para aceitar requisições de:
- `http://localhost:5173` (frontend Vite)
- `http://127.0.0.1:5173`

Adicionar mais origens no `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://outro-dominio.com
```

---

## 📝 Notas Importantes

1. **Media Files**: Em desenvolvimento, são servidos automaticamente. Em produção, use Nginx ou S3.

2. **Secret Key**: Sempre use uma secret key forte em produção (gerar com `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)

3. **DEBUG**: Sempre `False` em produção.

4. **Database**: SQLite para dev, PostgreSQL para produção.

5. **Tokens JWT**: São armazenados no frontend. Access tokens expiram em 1h.

---

## 🐛 Troubleshooting

### Erro: "No module named 'psycopg2'"
```bash
uv sync
```

### Erro: "Secret key must not be empty"
Verifique o arquivo `.env` e a variável `SECRET_KEY`.

### Erro de CORS
Adicione a origem do frontend em `CORS_ALLOWED_ORIGINS` no `.env`.

### Token expirado
Use o endpoint `/api/auth/token/refresh/` com o refresh token.

---

## 📖 Documentação Adicional

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentação completa da API
- [Django REST Framework](https://www.django-rest-framework.org/)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)
- [django-filter](https://django-filter.readthedocs.io/)

---

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Faça commit das mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT

---

**Versão:** 1.0  
**Última atualização:** Janeiro 2025