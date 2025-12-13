# Chapterly Backend - API REST

> Django REST Framework API para gerenciamento de apresentações técnicas

## 🚀 Stack

- **Django 6.0** + **Django REST Framework 3.16**
- **PostgreSQL** (produção) / **SQLite** (desenvolvimento)
- **JWT Authentication** (djangorestframework-simplejwt)
- **django-filter** - Filtros avançados
- **drf-spectacular** - Documentação OpenAPI/Swagger  
- **Pillow** - Upload de imagens

## 🔧 Setup Rápido

### 1. Instalar dependências

```bash
# Na raiz do projeto
uv sync
```

### 2. Configurar ambiente

```bash
cp backend/.env.example backend/.env
# Editar .env com SECRET_KEY, DATABASE_URL, etc.
```

### 3. Rodar migrations e criar superuser

```bash
cd backend
python manage.py migrate
python manage.py create_superuser_from_env
```

### 4. (Opcional) Popular dados de exemplo

```bash
python manage.py seed_data
```

### 5. Iniciar servidor

```bash
python manage.py runserver
# Acesse: http://localhost:8000
```

## 📚 Documentação Interativa

- **Swagger UI**: <http://localhost:8000/api/docs/>
- **ReDoc**: <http://localhost:8000/api/redoc/>
- **Schema JSON**: <http://localhost:8000/api/schema/>
- **Admin**: <http://localhost:8000/admin/>

---

# 📖 Referência da API

## Base URL

```
http://localhost:8000/api/
```

## Autenticação

A API usa JWT (JSON Web Tokens). Após o login, você receberá `access_token` e `refresh_token`.

### Headers

```
Authorization: Bearer {access_token}
```

### Tokens

- **Access Token**: 1 hora de validade
- **Refresh Token**: 7 dias de validade

---

## Endpoints de Autenticação

### Registro de Usuário

**POST** `/api/auth/register/`

**Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "senha123456",
  "password_confirm": "senha123456",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "Usuário registrado com sucesso!"
}
```

---

### Login

**POST** `/api/auth/login/`

**Body:**

```json
{
  "username": "johndoe",
  "password": "senha123456"
}
```

**Response (200):**

```json
{
  "user": { ... },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "Login realizado com sucesso!"
}
```

---

### Refresh Token

**POST** `/api/auth/token/refresh/`

**Body:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Logout

**POST** `/api/auth/logout/`

**Headers:** Authorization required

**Body:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**

```json
{
  "message": "Logout realizado com sucesso!"
}
```

---

### Perfil do Usuário

**GET** `/api/auth/profile/`

Retorna o perfil do usuário autenticado.

**Headers:** Authorization required

**Response (200):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2025-01-15T10:00:00Z",
  "ideias_criadas_count": 5,
  "apresentacoes_count": 3,
  "votos_count": 12,
  "ideias_criadas": [ ... ],
  "ideias_apresentando": [ ... ]
}
```

**PUT/PATCH** - Atualizar perfil

---

### Alterar Senha

**POST** `/api/auth/change-password/`

**Headers:** Authorization required

**Body:**

```json
{
  "old_password": "senha123456",
  "new_password": "novasenha123456",
  "new_password_confirm": "novasenha123456"
}
```

---

## Endpoints de Ideias

### Listar Ideias

**GET** `/api/ideas/`

**Query Parameters:**

- `page` (int): Número da página
- `status` (string): pendente, agendado, concluido
- `tags` (string): IDs separados por vírgula (ex: "1,2,3")
- `autor` (int): ID do autor
- `apresentador` (int): ID do apresentador
- `search` (string): Buscar por título ou descrição
- `ordering` (string): -created_at, data_agendada, vote_count

**Response (200):**

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/ideas/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "titulo": "Clean Architecture no Django",
      "descricao": "Como aplicar princípios de Clean Architecture",
      "imagem": "http://localhost:8000/media/ideas/2025/01/image.jpg",
      "autor": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com"
      },
      "apresentador": null,
      "tags": [
        {
          "id": 1,
          "nome": "Django",
          "cor": "#092E20",
          "slug": "django"
        }
      ],
      "status": "pendente",
      "data_agendada": null,
      "vote_count": 12,
      "vote_percentage": 85.7,
      "has_voted": true,
      "precisa_apresentador": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### Criar Ideia

**POST** `/api/ideas/`

**Headers:** Authorization required

**Body:**

```json
{
  "titulo": "Minha Nova Ideia",
  "descricao": "Descrição breve",
  "conteudo": "# Conteúdo Markdown",
  "imagem": "file upload",
  "tags": [1, 2],
  "quero_apresentar": true
}
```

---

### Detalhes da Ideia

**GET** `/api/ideas/{id}/`

**Response (200):**

```json
{
  "id": 1,
  "titulo": "Clean Architecture no Django",
  "descricao": "Como aplicar princípios...",
  "conteudo": "# Conteúdo completo em Markdown",
  "imagem": "http://localhost:8000/media/ideas/image.jpg",
  "autor": { ... },
  "apresentador": null,
  "tags": [ ... ],
  "status": "pendente",
  "data_agendada": null,
  "votos": [ ... ],
  "comentarios": [ ... ],
  "vote_count": 12,
  "vote_percentage": 85.7,
  "has_voted": true,
  "precisa_apresentador": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### Atualizar Ideia

**PUT/PATCH** `/api/ideas/{id}/`

Apenas o autor pode atualizar.

---

### Deletar Ideia

**DELETE** `/api/ideas/{id}/`

Apenas o autor ou admin pode deletar.

**Response (204):** No content

---

### Votar em Ideia

**POST** `/api/ideas/{id}/vote/`

Toggle voto: adiciona se não votou, remove se já votou.

**Headers:** Authorization required

**Response (200/201):**

```json
{
  "detail": "Voto registrado com sucesso.",
  "voted": true
}
```

---

### Voluntariar-se como Apresentador

**POST** `/api/ideas/{id}/volunteer/`

**Headers:** Authorization required

**Response (200):**

```json
{
  "detail": "Você se inscreveu como apresentador!"
}
```

---

### Remover-se como Apresentador

**DELETE** `/api/ideas/{id}/unvolunteer/`

**Headers:** Authorization required

---

### Reagendar Apresentação

**PATCH** `/api/ideas/{id}/reschedule/`

Apenas criador, apresentador ou admin.

**Body:**

```json
{
  "data_agendada": "2025-01-20T14:00:00Z"
}
```

---

### Verificar Permissões

**GET** `/api/ideas/{id}/permissions/`

**Headers:** Authorization required

**Response (200):**

```json
{
  "editable": true,
  "deletable": false,
  "reschedulable": true
}
```

---

### Próximas Apresentações

**GET** `/api/ideas/upcoming/`

Retorna as próximas 5 apresentações agendadas.

---

### Timeline

**GET** `/api/ideas/timeline/`

Retorna todas as apresentações agendadas, ordenadas por data.

**Query Parameters:**

- `status` (string): Filtrar por status

---

### Estatísticas Gerais

**GET** `/api/ideas/stats/`

**Response (200):**

```json
{
  "total_ideias": 42,
  "pendentes": 15,
  "agendadas": 10,
  "concluidas": 17,
  "precisa_apresentador": 8,
  "total_votos": 234
}
```

---

## Endpoints de Tags

### Listar Tags

**GET** `/api/tags/`

**Response (200):**

```json
[
  {
    "id": 1,
    "nome": "Django",
    "cor": "#092E20",
    "slug": "django",
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

---

## Endpoints de Comentários

### Listar Comentários

**GET** `/api/comments/`

**Query Parameters:**

- `idea` (int): ID da ideia

**Response (200):**

```json
[
  {
    "id": 1,
    "user": { ... },
    "idea": 1,
    "conteudo": "Ótima ideia!",
    "parent": null,
    "respostas": [],
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### Criar Comentário

**POST** `/api/comments/`

**Headers:** Authorization required

**Body:**

```json
{
  "idea": 1,
  "conteudo": "Meu comentário aqui",
  "parent": null
}
```

---

### Deletar Comentário

**DELETE** `/api/comments/{id}/`

Apenas o autor ou admin.

---

## Endpoints de Notificações

### Listar Notificações

**GET** `/api/notifications/`

**Headers:** Authorization required

**Response (200):**

```json
[
  {
    "id": 1,
    "tipo": "voto",
    "mensagem": "johndoe votou na sua ideia 'Clean Architecture'",
    "idea": { ... },
    "lido": false,
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### Notificações Não Lidas

**GET** `/api/notifications/unread/`

**Headers:** Authorization required

---

### Marcar como Lida

**PATCH** `/api/notifications/{id}/mark_as_read/`

**Headers:** Authorization required

---

### Marcar Todas como Lidas

**POST** `/api/notifications/mark_all_as_read/`

**Headers:** Authorization required

---

## 🎯 Conceitos Importantes

### Status Dinâmico

O status é **calculado**, não armazenado:

```python
# ✅ CORRETO
idea.data_agendada = datetime.now() + timedelta(days=7)
idea.save()  # Status vira "agendado" automaticamente

# ❌ ERRADO
idea.status = "agendado"  # Não funciona! Status é @property
```

**Regras:**

- `pendente`: `data_agendada` é `null`
- `agendado`: `data_agendada > now()`
- `concluido`: `data_agendada <= now()`

---

### Permissões Granulares

- **Editar**: Criador OR Apresentador OR Admin
- **Deletar**: Criador OR Admin (apresentador NÃO pode!)
- **Reagendar**: Criador OR Apresentador OR Admin

Use `GET /api/ideas/{id}/permissions/` para verificar.

---

### QuerySets Otimizados

**Sempre** use `.with_vote_stats()` para evitar N+1 queries:

```python
# ✅ CORRETO
ideas = Idea.objects.with_vote_stats()

# ❌ ERRADO (causará múltiplas queries)
ideas = Idea.objects.all()
```

---

## 📁 Estrutura

```
backend/
├── backend/              # Configurações Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                 # App de autenticação
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py      # User customizado com avatar
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── register_serializer.py
│   │   ├── login_serializer.py
│   │   ├── user_profile_serializer.py
│   │   ├── token_response_serializer.py
│   │   └── change_password_serializer.py
│   ├── views/
│   │   ├── __init__.py
│   │   ├── register_view.py
│   │   ├── login_view.py
│   │   ├── logout_view.py
│   │   ├── user_profile_view.py
│   │   ├── user_stats_view.py
│   │   └── change_password_view.py
│   └── management/
│       └── commands/
│           └── create_superuser_from_env.py
├── talks/                # App principal
│   ├── models/
│   │   ├── __init__.py
│   │   ├── idea.py      # Idea com status dinâmico
│   │   ├── tag.py       # Tag (categorização)
│   │   ├── vote.py      # Vote (votação)
│   │   ├── comment.py   # Comment (aninhado)
│   │   └── notification.py  # Notification
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── idea_serializer.py
│   │   ├── tag_serializer.py
│   │   ├── vote_serializer.py
│   │   ├── comment_serializer.py
│   │   ├── notification_serializer.py
│   │   ├── user_serializer.py
│   │   └── reschedule_serializer.py
│   ├── views/
│   │   ├── viewsets/
│   │   │   ├── __init__.py
│   │   │   ├── idea_viewset.py
│   │   │   ├── tag_viewset.py
│   │   │   ├── comment_viewset.py
│   │   │   └── notification_viewset.py
│   │   └── api_views/
│   │       ├── __init__.py
│   │       └── uploads_api_view.py  # Upload de imagens
│   ├── filters/
│   │   ├── __init__.py
│   │   └── idea_filter.py
│   ├── permissions.py   # Permissões granulares
│   └── management/
│       └── commands/
│           ├── seed_data.py
│           └── seed_timeline.py
└── manage.py
```

---

## 🔧 Comandos Úteis

### Migrations

```bash
python manage.py makemigrations
python manage.py migrate
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

# Popular timeline com dados massivos
python manage.py seed_timeline --years 10
```

### Schema OpenAPI

```bash
python manage.py spectacular --file schema.yml
```

### Shell Interativo

```bash
python manage.py shell
```

---

## 📊 Códigos de Status HTTP

- `200 OK` - Sucesso
- `201 Created` - Recurso criado
- `204 No Content` - Sucesso sem conteúdo (delete)
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

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

## 📝 Exemplos de Uso com cURL

### Criar ideia e votar

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "senha123456"}'

# Response: { "access": "TOKEN_AQUI", ... }

# 2. Criar ideia
curl -X POST http://localhost:8000/api/ideas/ \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Minha Ideia",
    "descricao": "Descrição da ideia",
    "conteudo": "# Conteúdo Markdown",
    "tags": [1],
    "quero_apresentar": true
  }'

# 3. Votar
curl -X POST http://localhost:8000/api/ideas/1/vote/ \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## 🐛 Troubleshooting

### Erro de CORS

Verifique `CORS_ALLOWED_ORIGINS` no `.env` e inclua `http://localhost:5173`

### JWT Expired

Frontend tem auto-refresh configurado. Verificar se `REFRESH_TOKEN` está válido.

### N+1 Queries

Sempre use `Idea.objects.with_vote_stats()`. Use Django Debug Toolbar para detectar.

---

**Desenvolvido com Django 🐍**
