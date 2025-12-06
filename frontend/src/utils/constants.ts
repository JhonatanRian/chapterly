// API Base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Company Name
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || "Chapterly";

// Status da Ideia
export const STATUS = {
  PENDENTE: "pendente",
  AGENDADO: "agendado",
  CONCLUIDO: "concluido",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  agendado: "Agendado",
  concluido: "Concluído",
};

export const STATUS_COLORS: Record<string, string> = {
  pendente:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  agendado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  concluido: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

// Prioridade da Ideia
export const PRIORITY = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORITY_COLORS: Record<string, string> = {
  baixa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  media:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// Tipo de Notificação
export const NOTIFICATION_TYPE = {
  VOTO: "voto",
  VOLUNTARIO: "voluntario",
  AGENDAMENTO: "agendamento",
  COMENTARIO: "comentario",
  MENCAO: "mencao",
} as const;

export const NOTIFICATION_LABELS: Record<string, string> = {
  voto: "Novo Voto",
  voluntario: "Novo Voluntário",
  agendamento: "Apresentação Agendada",
  comentario: "Novo Comentário",
  mencao: "Menção",
};

// Rotas
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  IDEAS: "/ideas",
  IDEA_DETAIL: "/ideas/:id",
  IDEA_CREATE: "/ideas/new",
  IDEA_EDIT: "/ideas/:id/edit",
  CALENDAR: "/calendar",
  PROFILE: "/profile",
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login/",
  REGISTER: "/auth/register/",
  LOGOUT: "/auth/logout/",
  REFRESH: "/auth/token/refresh/",
  PROFILE: "/auth/profile/",
  STATS: "/auth/stats/",
  CHANGE_PASSWORD: "/auth/change-password/",

  // Ideas
  IDEAS: "/ideas/",
  IDEAS_UPCOMING: "/ideas/upcoming/",
  IDEAS_TIMELINE: "/ideas/timeline/",
  IDEAS_STATS: "/ideas/stats/",

  // Tags
  TAGS: "/tags/",

  // Comments
  COMMENTS: "/comments/",

  // Notifications
  NOTIFICATIONS: "/notifications/",
  NOTIFICATIONS_UNREAD: "/notifications/unread/",
  NOTIFICATIONS_MARK_ALL_READ: "/notifications/mark_all_read/",
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "chapterly_access_token",
  REFRESH_TOKEN: "chapterly_refresh_token",
  USER: "chapterly_user",
  THEME: "chapterly_theme",
} as const;

// Pagination
export const ITEMS_PER_PAGE = 12;

// Validação
export const VALIDATION = {
  MIN_TITLE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 10,
  MIN_PASSWORD_LENGTH: 8,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
} as const;

// Mensagens
export const MESSAGES = {
  // Sucesso
  LOGIN_SUCCESS: "Login realizado com sucesso!",
  LOGOUT_SUCCESS: "Logout realizado com sucesso!",
  REGISTER_SUCCESS: "Cadastro realizado com sucesso!",
  IDEA_CREATED: "Ideia criada com sucesso!",
  IDEA_UPDATED: "Ideia atualizada com sucesso!",
  IDEA_DELETED: "Ideia deletada com sucesso!",
  VOTE_SUCCESS: "Voto registrado!",
  VOTE_REMOVED: "Voto removido!",
  VOLUNTEER_SUCCESS: "Você se inscreveu como apresentador!",
  UNVOLUNTEER_SUCCESS: "Inscrição removida!",
  PROFILE_UPDATED: "Perfil atualizado com sucesso!",
  PASSWORD_CHANGED: "Senha alterada com sucesso!",

  // Erro
  LOGIN_ERROR: "Erro ao fazer login. Verifique suas credenciais.",
  NETWORK_ERROR: "Erro de conexão. Tente novamente.",
  GENERIC_ERROR: "Ocorreu um erro. Tente novamente.",
  UNAUTHORIZED: "Você não tem permissão para essa ação.",
  NOT_FOUND: "Recurso não encontrado.",

  // Validação
  REQUIRED_FIELD: "Este campo é obrigatório",
  INVALID_EMAIL: "Email inválido",
  PASSWORDS_DONT_MATCH: "As senhas não coincidem",
  PASSWORD_TOO_SHORT: "A senha deve ter pelo menos 8 caracteres",
  TITLE_TOO_SHORT: "O título deve ter pelo menos 5 caracteres",
  DESCRIPTION_TOO_SHORT: "A descrição deve ter pelo menos 10 caracteres",
  IMAGE_TOO_LARGE: "A imagem não pode ter mais de 5MB",
  INVALID_IMAGE_TYPE: "Formato de imagem não suportado",
} as const;

// Query Keys (React Query)
export const QUERY_KEYS = {
  IDEAS: "ideas",
  IDEA: "idea",
  TAGS: "tags",
  PROFILE: "profile",
  STATS: "stats",
  NOTIFICATIONS: "notifications",
  COMMENTS: "comments",
  UPCOMING: "upcoming",
  TIMELINE: "timeline",
} as const;

// Timeouts
export const TIMEOUTS = {
  TOAST: 3000,
  DEBOUNCE: 300,
} as const;
