# Chapterly

> Sistema de gerenciamento de apresentações e retrospectivas para chapters de backend

**Chapterly** é uma plataforma completa para organizar ideias de apresentação, retrospectivas de equipe, votação, agendamento e acompanhamento de palestras técnicas e melhorias contínuas.

## 🎯 Funcionalidades

### 📊 Apresentações (Ideas)

- 📝 **Gestão de Ideias**: Criação e discussão de propostas de apresentação
- 🗳️ **Sistema de Votação**: Vote nas apresentações que você quer ver
- 📅 **Calendário Interativo**: Agende e reagende apresentações com drag & drop (FullCalendar)
- 💬 **Comentários**: Discussões aninhadas em cada ideia
- 🔔 **Notificações**: Acompanhe votos, voluntários e agendamentos
- 👤 **Perfis de Usuário**: Histórico de apresentações e estatísticas

### 🔄 Retrospectivas

- 📋 **Templates Customizáveis**: Start, Stop, Continue / What Went Well, To Improve, Action Items
- 🎨 **Quadro Colaborativo**: Adicione cards por categoria com cores e emojis
- 🗳️ **Votação em Items**: Vote nos pontos mais importantes para discutir
- 👥 **Gestão de Participantes**: Join/leave retrospec tivas, controle de acesso
- 📊 **Métricas Globais** (Admin): Análise de engajamento, padrões, tendências
- 🔄 **Fluxo de Status**: Rascunho → Em Andamento → Concluída

### 🎨 Interface & UX

- 🌓 **Dark Mode**: Suporte completo com Tailwind CSS
- 📱 **Design Responsivo**: Mobile-first, adaptável a todos os tamanhos
- ⚡ **Performance**: Scroll infinito para suportar 1.000+ itens
- ✨ **Animações**: Transições suaves com Framer Motion

## 🚀 Stack Tecnológica

**Backend**: Django 6.0 + DRF + PostgreSQL + JWT  
**Frontend**: React 19 + TypeScript + Vite + TanStack Query + TipTap + FullCalendar + Tailwind CSS

**Gerenciamento de Dependências**: uv (Python), npm (JavaScript)

## ⚡ Início Rápido

```bash
# Backend
cd backend
uv sync
python manage.py migrate
python manage.py seed_data
python manage.py runserver  # http://localhost:8000

# Frontend (outro terminal)
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Ou use Docker**:

```bash
./start.sh dev
```

## 📚 Documentação

Toda a documentação foi consolidada em 2 arquivos:

- **[📋 Regras de Negócio](docs/BUSINESS_RULES.md)** - Status, permissões, votação, notificações, histórico
- **[🔧 Guia Técnico](docs/TECHNICAL_GUIDE.md)** - Implementação, setup, deploy, contribuição, padrões

### Estrutura do Projeto

```
chapterly/
├── backend/              # Django REST API
│   ├── talks/           # App principal (models, views, serializers)
│   │   ├── models/      # Idea, Vote, Comment, Retro, RetroItem, RetroTemplate, etc.
│   │   ├── views/       # ViewSets (IdeaViewSet, RetroViewSet, etc.)
│   │   ├── serializers/ # DRF serializers
│   │   └── filters/     # django-filter integration
│   ├── core/            # Autenticação e usuários
│   └── manage.py
├── frontend/            # React + TypeScript
│   └── src/
│       ├── pages/       # Páginas (Ideas, Retros, Calendar, Timeline, Metrics)
│       ├── components/  # Componentes reutilizáveis
│       │   ├── metrics/ # Componentes de métricas (MetricsGrid, etc.)
│       │   └── retro/   # Componentes de retrospectiva
│       ├── services/    # API client (ideas, retros, auth, etc.)
│       ├── hooks/       # Custom hooks (useRetroMetrics, useIdeaPermissions)
│       └── types/       # TypeScript types (Idea, Retro, RetroMetrics)
└── docs/                # Documentação consolidada
    ├── BUSINESS_RULES.md   # Todas as regras de negócio
    └── TECHNICAL_GUIDE.md  # Toda a implementação técnica
```

## 🔑 Conceitos Importantes

### Status Dinâmico (Ideas)

O status de apresentações **NÃO** é armazenado no banco. É calculado automaticamente baseado em `data_agendada`:

- **pendente**: sem data agendada
- **agendado**: data futura
- **concluido**: data passada

```python
# ❌ ERRADO - não funciona!
idea.status = "agendado"

# ✅ CERTO
idea.data_agendada = datetime.now() + timedelta(days=7)  # Status vira "agendado" automaticamente
```

### Status de Retrospectivas

Ao contrário das Ideas, o status de Retros **É armazenado** no campo `status`:

- **rascunho**: Criada, editável, participantes podem entrar
- **em_andamento**: Iniciada via `POST /retros/{id}/start/`, não editável
- **concluida**: Finalizada via `POST /retros/{id}/finish/`, somente leitura

```python
# Transições controladas por actions
POST /api/retros/{id}/start/    # rascunho → em_andamento
POST /api/retros/{id}/finish/   # em_andamento → concluida
```

### Permissões Granulares

- **Editar**: Criador OR Apresentador OR Admin
- **Deletar**: Criador OR Admin (apresentadores NÃO podem deletar!)
- **Reagendar**: Criador OR Apresentador OR Admin

Sempre verifique via endpoint: `GET /api/ideas/{id}/permissions/`

### Scroll Infinito

Sistema otimizado para 1.000+ apresentações usando TanStack Query `useInfiniteQuery`:

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["ideas", filters],
  queryFn: ({ pageParam = 1 }) => ideasService.getIdeas({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.next ? lastPage.next.page : undefined,
});
```

### QuerySet Optimization

⚠️ **IMPORTANTE**: Sempre use managers customizados para estatísticas de votos:

```python
# Ideas - contagem de votos
ideas = Idea.objects.with_vote_stats()  # Adiciona vote_count, vote_percentage

# Retro Items - contagem de votos
# SEMPRE chame .with_vote_stats() ANTES de .filter()
items = RetroItem.objects.with_vote_stats().filter(retro=retro_id)  # ✅ Correto
items = RetroItem.objects.filter(retro=retro_id).with_vote_stats()  # ❌ ERRO!
```

### Métricas Globais (Admin Only)

Endpoint `GET /api/retros/metrics/` retorna análise agregada:

- **Métricas Gerais**: Total retros, items, votos, taxas médias
- **Análise de Engajamento**: Participação, tendências
- **Análise de Padrões**: Distribuição por categoria, top 10 votados, action items

```typescript
// Frontend - protegido por permissão
const isAdmin = user?.is_staff;
const { data: metrics } = useRetroMetrics(filters, { enabled: isAdmin });

// Sidebar - menu oculto para não-admin
{isAdmin && <MenuItem to="/retros/metrics">Métricas</MenuItem>}
```

- Carrega 12 items por vez
- Auto-load ao chegar em 80% do scroll
- Memória: 15MB (vs 100MB antes)
- Performance: 60fps constante

## 🐳 Docker

```bash
# Desenvolvimento
./start.sh dev

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contribuindo

Veja todas as convenções e padrões em **[docs/TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md)** (seção Contribuição).

**Resumo rápido**:

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`)
- Python: Black + Flake8 + Type hints
- TypeScript: Prettier + ESLint + Services (nunca `api.*` direto!)
- React Query Keys: estrutura consistente (`["ideas", filters]`)

## 📄 Licença

MIT

## 👨‍💻 Autor

**Jhonatan Rian** - [GitHub](https://github.com/JhonatanRian)

---

**Para mais detalhes**, consulte:

- [📋 Regras de Negócio](docs/BUSINESS_RULES.md)
- [🔧 Guia Técnico](docs/TECHNICAL_GUIDE.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para mais detalhes.

## 📄 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

## 🐛 Problemas Conhecidos

- Sistema de notificações está acoplado às views (refatoração planejada)
- Cobertura de testes ainda em desenvolvimento
- Documentação de alguns componentes pode estar desatualizada

## 🗺️ Roadmap

- [ ] Refatorar sistema de notificações para service layer
- [ ] Adicionar envio de emails para notificações
- [ ] Implementar testes automatizados (backend e frontend)
- [ ] Melhorar cobertura de testes (meta: 60%+)
- [ ] Padronizar código TypeScript
- [ ] Configuração de produção otimizada
- [ ] PWA para uso offline

## 📧 Contato

**Desenvolvedor**: Jhonatan Rian  
**GitHub**: [@JhonatanRian](https://github.com/JhonatanRian)

---

**Feito com ❤️ para facilitar a organização de apresentações técnicas**
