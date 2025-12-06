import api from "./api";
import type {
  IdeaListItem,
  IdeaDetail,
  IdeaFormData,
  PaginatedResponse,
  IdeaFilters,
  VoteResponse,
  MessageResponse,
  GeneralStats,
} from "../types";
import { ENDPOINTS } from "../utils/constants";

/**
 * Serviço para gerenciar ideias
 */
class IdeasService {
  /**
   * Lista ideias com paginação e filtros
   */
  async getIdeas(
    filters?: IdeaFilters,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get<PaginatedResponse<IdeaListItem>>(
      `${ENDPOINTS.IDEAS}?${params.toString()}`,
    );

    return response.data;
  }

  /**
   * Obtém detalhes de uma ideia
   */
  async getIdea(id: number): Promise<IdeaDetail> {
    const response = await api.get<IdeaDetail>(`${ENDPOINTS.IDEAS}${id}/`);
    return response.data;
  }

  /**
   * Obtém detalhes de uma ideia (alias)
   */
  async getIdeaById(id: number): Promise<IdeaDetail> {
    return this.getIdea(id);
  }

  /**
   * Cria uma nova ideia
   */
  async createIdea(data: IdeaFormData): Promise<IdeaDetail> {
    const formData = new FormData();

    // Adicionar campos básicos
    formData.append("titulo", data.titulo);
    formData.append("descricao", data.descricao);
    formData.append("conteudo", data.conteudo);
    formData.append("prioridade", data.prioridade);

    // Adicionar imagem se existir
    if (data.imagem) {
      formData.append("imagem", data.imagem);
    }

    // Adicionar tags
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tagId) => {
        formData.append("tags", String(tagId));
      });
    }

    // Adicionar flag de quero_apresentar
    if (data.quero_apresentar !== undefined) {
      formData.append("quero_apresentar", String(data.quero_apresentar));
    }

    const response = await api.post<IdeaDetail>(ENDPOINTS.IDEAS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  /**
   * Atualiza uma ideia existente
   */
  async updateIdea(
    id: number,
    data: Partial<IdeaFormData>,
  ): Promise<IdeaDetail> {
    const formData = new FormData();

    // Adicionar apenas campos que foram fornecidos
    if (data.titulo) formData.append("titulo", data.titulo);
    if (data.descricao) formData.append("descricao", data.descricao);
    if (data.conteudo) formData.append("conteudo", data.conteudo);
    if (data.prioridade) formData.append("prioridade", data.prioridade);

    // Imagem
    if (data.imagem) {
      formData.append("imagem", data.imagem);
    }

    // Tags
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tagId) => {
        formData.append("tags", String(tagId));
      });
    }

    const response = await api.patch<IdeaDetail>(
      `${ENDPOINTS.IDEAS}${id}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  }

  /**
   * Deleta uma ideia
   */
  async deleteIdea(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.IDEAS}${id}/`);
  }

  /**
   * Vota ou remove voto de uma ideia (toggle)
   */
  async vote(id: number): Promise<VoteResponse> {
    const response = await api.post<VoteResponse>(
      `${ENDPOINTS.IDEAS}${id}/vote/`,
    );
    return response.data;
  }

  /**
   * Vota ou remove voto de uma ideia (toggle) - alias
   */
  async toggleVote(id: number): Promise<VoteResponse> {
    return this.vote(id);
  }

  /**
   * Voluntaria-se para apresentar uma ideia
   */
  async volunteer(id: number): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      `${ENDPOINTS.IDEAS}${id}/volunteer/`,
    );
    return response.data;
  }

  /**
   * Remove-se como apresentador de uma ideia
   */
  async unvolunteer(id: number): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(
      `${ENDPOINTS.IDEAS}${id}/unvolunteer/`,
    );
    return response.data;
  }

  /**
   * Obtém as próximas apresentações agendadas
   */
  async getUpcoming(
    limit: number = 5,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    const response = await api.get<PaginatedResponse<IdeaListItem>>(
      `${ENDPOINTS.IDEAS_UPCOMING}?limit=${limit}`,
    );
    return response.data;
  }

  /**
   * Obtém a timeline completa de apresentações
   */
  async getTimeline(
    limit: number = 10,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    const response = await api.get<PaginatedResponse<IdeaListItem>>(
      `${ENDPOINTS.IDEAS_TIMELINE}?limit=${limit}`,
    );
    return response.data;
  }

  /**
   * Obtém estatísticas gerais das ideias
   */
  async getStats(): Promise<GeneralStats> {
    const response = await api.get<GeneralStats>(ENDPOINTS.IDEAS_STATS);
    return response.data;
  }

  /**
   * Busca ideias por texto
   */
  async searchIdeas(
    query: string,
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ search: query, page });
  }

  /**
   * Filtra ideias por status
   */
  async getIdeasByStatus(
    status: string,
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ status: status as any, page });
  }

  /**
   * Filtra ideias por tag
   */
  async getIdeasByTag(
    tagIds: string,
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ tags: tagIds, page });
  }

  /**
   * Obtém ideias que precisam de apresentador
   */
  async getIdeasNeedingPresenter(
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ precisa_apresentador: true, page });
  }

  /**
   * Obtém ideias do usuário autenticado
   */
  async getMyIdeas(
    userId: number,
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ autor: userId, page });
  }

  /**
   * Obtém apresentações do usuário
   */
  async getMyPresentations(
    userId: number,
    page: number = 1,
  ): Promise<PaginatedResponse<IdeaListItem>> {
    return this.getIdeas({ apresentador: userId, page });
  }

  /**
   * Reagenda uma apresentação (atualiza data_agendada)
   * Usado pelo drag & drop do calendário
   */
  async reschedule(id: number, data_agendada: string): Promise<IdeaDetail> {
    const response = await api.patch<IdeaDetail>(
      `${ENDPOINTS.IDEAS}${id}/reschedule/`,
      { data_agendada },
    );
    return response.data;
  }
}

export const ideasService = new IdeasService();
export default ideasService;
