// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  date_joined?: string;
  ideias_criadas_count?: number;
  apresentacoes_count?: number;
  votos_count?: number;
}

export interface UserProfile extends User {
  ideias_criadas?: IdeaListItem[];
  ideias_apresentando?: IdeaListItem[];
}

export interface UserStats {
  ideias_criadas: number;
  apresentacoes: number;
  votos_dados: number;
  votos_recebidos: number;
  ideias_por_status: {
    pendentes: number;
    agendadas: number;
    concluidas: number;
  };
  apresentacoes_por_status: {
    agendadas: number;
    concluidas: number;
  };
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  user: UserProfile;
  access: string;
  refresh: string;
  message: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

// Tag Types
export interface Tag {
  id: number;
  nome: string;
  cor: string;
  slug: string;
  created_at?: string;
}

// Idea Types
export type IdeaStatus = "pendente" | "agendado" | "concluido";
export type IdeaPriority = "baixa" | "media" | "alta";

export interface IdeaListItem {
  id: number;
  titulo: string;
  descricao: string;
  imagem: string | null;
  autor: User;
  apresentador: User | null;
  tags: Tag[];
  status: IdeaStatus;
  prioridade: IdeaPriority;
  data_agendada: string | null;
  vote_count: number;
  vote_percentage: string;
  has_voted: boolean;
  precisa_apresentador: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: number;
  user: User;
  idea?: number;
  created_at: string;
}

export interface Comment {
  id: number;
  user: User;
  idea: number;
  conteudo: string;
  parent: number | null;
  respostas: Comment[];
  created_at: string;
  updated_at: string;
}

export interface IdeaDetail extends IdeaListItem {
  conteudo: string;
  votos: Vote[];
  comentarios: Comment[];
  is_presenter: boolean;
}

export interface IdeaFormData {
  titulo: string;
  descricao: string;
  conteudo: string;
  imagem?: File | null;
  tags: number[];
  prioridade: IdeaPriority;
  quero_apresentar?: boolean;
}

// Notification Types
export type NotificationType =
  | "voto"
  | "voluntario"
  | "agendamento"
  | "comentario"
  | "mencao";

export interface Notification {
  id: number;
  tipo: NotificationType;
  mensagem: string;
  idea: IdeaListItem | null;
  lido: boolean;
  created_at: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Response Types
export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export interface VoteResponse {
  detail: string;
  voted: boolean;
}

export interface MessageResponse {
  detail?: string;
  message?: string;
}

// Stats Types
export interface GeneralStats {
  total_ideias: number;
  pendentes: number;
  agendadas: number;
  concluidas: number;
  precisa_apresentador: number;
  total_votos: number;
}

// Filter Types
export interface IdeaFilters {
  status?: IdeaStatus;
  prioridade?: IdeaPriority;
  autor?: number;
  apresentador?: number;
  tags?: string;
  precisa_apresentador?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Store Types (Zustand)
export interface AuthStore {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  setTokens: (access: string, refresh: string) => void;
  refreshAccessToken: () => Promise<void>;
}

export interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}
