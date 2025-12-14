# Chapterly Frontend

> Aplicação React + TypeScript para gerenciamento de apresentações técnicas

## 🚀 Stack

- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool moderno e rápido
- **TanStack Query (React Query)** - Gerenciamento de estado servidor
- **Axios** - Cliente HTTP com interceptors JWT
- **React Router** - Roteamento
- **TipTap** - Editor de texto rico
- **FullCalendar** - Calendário interativo
- **Tailwind CSS** - Estilização utility-first
- **Framer Motion** - Animações
- **Lucide React** - Ícones

## 🔧 Setup Rápido

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Configurar ambiente (opcional)

Por padrão, o frontend se conecta ao backend em `http://localhost:8000`.

Se precisar alterar, edite `frontend/src/utils/constants.ts`:

```typescript
export const API_BASE_URL = "http://localhost:8000/api";
```

### 3. Iniciar servidor de desenvolvimento

```bash
npm run dev
# Acesse: http://localhost:5173
```

## 📦 Scripts Disponíveis

```bash
npm run dev         # Servidor de desenvolvimento (porta 5173)
npm run build       # Build de produção
npm run preview     # Preview do build de produção
npm run lint        # Executar ESLint
```

## 📁 Estrutura do Projeto

```
frontend/src/
├── components/          # Componentes reutilizáveis
│   ├── animations/     # Componentes de animação (Framer Motion)
│   ├── branding/       # Logo, marca
│   ├── buttons/        # Botões customizados
│   ├── Calendar/       # Componentes do calendário
│   ├── cards/          # Cards de ideias, timeline, dashboard
│   ├── common/         # Componentes genéricos (modals, badges, etc.)
│   ├── forms/          # Inputs, selectors, editores
│   └── layout/         # Layout (Header, Sidebar, Footer)
├── pages/              # Páginas principais
│   ├── Calendar/       # Calendário interativo
│   ├── Dashboard/      # Dashboard com cards e estatísticas
│   ├── Ideas/          # Lista, detalhes, formulário de ideias
│   ├── Login/          # Login e registro
│   ├── Profile/        # Perfil do usuário
│   └── Timeline/       # Timeline de apresentações
├── services/           # Camada de serviços (API)
│   ├── api.ts         # Cliente Axios configurado
│   ├── auth.service.ts
│   ├── ideas.service.ts
│   ├── comments.service.ts
│   └── notifications.service.ts
├── hooks/              # Custom hooks
│   ├── useIdeaPermissions.ts
│   ├── useSessionManager.ts
│   └── useConfetti.ts
├── types/              # TypeScript types/interfaces
│   └── index.ts       # Tipos centralizados
├── utils/              # Utilitários
│   ├── constants.ts   # Constantes (URLs, storage keys, etc.)
│   ├── formatDate.ts  # Formatação de datas
│   ├── errorHandler.ts
│   └── queryInvalidation.ts
├── App.tsx             # Componente raiz
└── main.tsx            # Entry point
```

## 🎯 Conceitos Importantes

### Service Layer Pattern

**Nunca** chame a API diretamente dos componentes. Sempre use services:

```typescript
// ✅ CORRETO
import { ideasService } from '@/services/ideas.service';
const idea = await ideasService.getIdea(id);

import { retrosService } from '@/services/retros.service';
const retro = await retrosService.getRetro(id);

// ❌ ERRADO
import { api } from '@/services/api';
const idea = await api.get(`/ideas/${id}/`);
```

**Serviços Disponíveis:**

- `ideas.service.ts` - CRUD de ideias + vote/volunteer/reschedule
- `retros.service.ts` - CRUD de retros + join/leave/start/finish/metrics
- `auth.service.ts` - Login/register/logout/refresh
- `comments.service.ts` - CRUD de comentários
- `notifications.service.ts` - Listar/marcar notificações

### React Query Keys

Estrutura consistente para cache:

```typescript
// Ideas
["ideas", filters]           // Lista com filtros
["ideas", "timeline"]        // Timeline
["idea", ideaId]             // Ideia específica
["idea", ideaId, "permissions"] // Permissões da ideia

// Retros
["retros", filters]          // Lista de retros
["retro", retroId]           // Retro específica
["retros", "metrics", filters] // Métricas globais (admin)
["retro-items", retroId]     // Items de uma retro

// Outros
["comments", ideaId]         // Comentários de uma ideia
["notifications"]            // Notificações do usuário
["retro-templates"]          // Templates de retro
```

### Autenticação JWT

1. Tokens armazenados em `localStorage`
2. Axios interceptor adiciona token automaticamente
3. Refresh automático em 401
4. Logout + redirect se refresh falhar

Veja `frontend/src/services/api.ts` (linhas 30-120).

### Status Dinâmico

**Ideas**: Status não é setável diretamente. Ele é calculado no backend baseado em `data_agendada`:

```typescript
// ✅ CORRETO - Atualizar data_agendada
await ideasService.reschedule(ideaId, newDate);

// ❌ ERRADO - Não tente setar status
idea.status = "agendado"; // Não funciona!
```

**Retros**: Status É armazenado e controlado por actions:

```typescript
// Transições controladas
await retrosService.start(retroId);  // rascunho → em_andamento
await retrosService.finish(retroId); // em_andamento → concluida
```

### Permissões

Sempre verifique permissões via hook:

```typescript
const { data: permissions } = useIdeaPermissions(ideaId);

// Condicionalmente renderizar
{permissions?.editable && <EditButton />}
{permissions?.deletable && <DeleteButton />}
{permissions?.reschedulable && <RescheduleButton />}
```

## 🎨 Componentes Principais

### Páginas

**Ideas:**

- **Dashboard** - Visão geral, estatísticas, próximas apresentações
- **IdeasListPage** - Lista paginada com filtros e busca
- **IdeaDetailPage** - Detalhes, comentários, ações (votar, voluntariar)
- **IdeaFormPage** - Criar/editar ideias com TipTap
- **CalendarPage** - Calendário FullCalendar com drag & drop
- **TimelinePage** - Timeline ordenada com highlights
- **ProfilePage** - Perfil, ideias criadas, apresentações

**Retros:**

- **RetrosListPage** - Lista de retrospectivas com filtros
- **RetroDetailPage** - Quadro colaborativo com items por categoria
- **RetroFormPage** - Criar/editar retrospectivas
- **RetroMetricsPage** - Métricas globais (admin only)
- **RetroTemplatesPage** - Lista de templates disponíveis

### Componentes Reutilizáveis

**Common:**

- **Modal** - Modal genérico
- **ConfirmModal** - Modal de confirmação
- **DateTimePicker** - Seletor de data/hora
- **StatsCard** - Card de estatística (usado em dashboard/métricas)
- **EmptyState** - Estado vazio genérico

**Ideas:**

- **IdeaCard** - Card de ideia (usado em listas/grid)
- **TimelineCard** - Card para timeline (com destaque)
- **StatusBadge** - Badge de status (pendente/agendado/concluído)
- **PriorityBadge** - Badge de prioridade (baixa/média/alta)
- **TagBadge** - Badge de tag
- **HypeDisplay** - Exibição de votos com barra de progresso
- **RichTextEditor** - Editor TipTap configurado
- **MarkdownRenderer** - Renderizador de Markdown
- **CommentsSection** - Seção de comentários aninhados

**Retros:**

- **RetroCard** - Card de retrospectiva
- **RetroBoard** - Quadro colaborativo com categorias
- **RetroItemCard** - Card de item (com votação)
- **CategoryColumn** - Coluna de categoria no quadro
- **ParticipantsList** - Lista de participantes

**Metrics (Admin):**

- **MetricsGrid** - Grid com 6 cards de métricas gerais
- **EngagementAnalysis** - Análise de participação e tendências
- **PatternAnalysis** - Análise de padrões (categorias, top 10)
- **MetricsFilters** - Filtros de métricas (status, datas)

### Animações

Todos os componentes de animação estão em `components/animations/`:

- **AnimatedPage** - Wrapper para páginas (fade-in)
- **AnimatedGrid** - Grid com stagger
- **AnimatedButton** - Botão com hover/tap
- **AnimatedCounter** - Contador animado

## 🔍 Features Principais

### Calendário Interativo

- 4 visualizações: Mês, Semana, Dia, Lista
- Drag & drop para reagendar
- Locale pt-BR
- Dark mode
- Responsivo

### Timeline

- Ordenação cronológica
- Highlights inteligentes (apresentações de hoje ou próxima)
- Agrupamento por data
- Filtros por status

### Sistema de Votação (Hype)

- Toggle com um clique
- Optimistic updates
- Animação confetti ao hypar
- Barra de progresso visual

### Comentários

- Aninhamento de 2 níveis
- Edição/exclusão (para autores)
- Markdown suportado
- Tempo relativo (ex: "há 2 horas")

### Notificações

- Badge no header
- Dropdown com últimas notificações
- Auto-refetch a cada 30s
- Marcar como lida (individual ou todas)

## 🧪 Testes

```bash
npm run test
```

## 🔧 Configuração

### ESLint

Configurado em `eslint.config.js` com:

- React recomendado
- TypeScript
- Hooks rules

### Tailwind CSS

Configurado em `tailwind.config.js` com:

- Dark mode class-based
- Cores customizadas
- Animações personalizadas

### Vite

Configurado em `vite.config.ts` com:

- Path aliases (`@/` → `src/`)
- React plugin
- Otimizações de build

## 🎨 Temas

### Dark Mode

Ativado via classe `dark` no `<html>`:

```typescript
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

Classes Tailwind suportam dark mode:

```tsx
<div className="bg-white dark:bg-gray-800">
```

## 📖 Documentação Adicional

- [README Principal](../README.md) - Guia geral do projeto
- [Copilot Instructions](../.github/copilot-instructions.md) - Guia para IAs
- [Backend README](../backend/README.md) - Documentação da API

## 🐛 Troubleshooting

### Erro de CORS

- Verifique se backend está rodando
- Backend deve ter `CORS_ALLOWED_ORIGINS=http://localhost:5173`

### JWT expirado

- Frontend tem auto-refresh configurado
- Se continuar, faça logout/login novamente

### Componentes não renderizam

- Verifique console do navegador
- Verifique se React Query devtools está habilitado (dev)

### Build falha

- Rode `npm install` novamente
- Verifique versão do Node.js (18+)
- Limpe cache: `rm -rf node_modules package-lock.json && npm install`

---

Desenvolvido com React ⚛️ por [@JhonatanRian](https://github.com/JhonatanRian)
