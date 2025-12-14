/**
 * Serviço de API para Retrospectivas (Retros).
 * Gerencia operações CRUD e ações customizadas para retros, items e templates.
 */

import api from "./api";
import type {
  RetroListItem,
  RetroDetail,
  RetroFormData,
  RetroItem,
  RetroItemFormData,
  RetroTemplate,
  RetroMetrics,
  RetroMetricsFilters,
  RetroFilters,
  VoteItemResponse,
  PaginatedResponse,
  MessageResponse,
} from "../types";

/**
 * Endpoints da API de Retros
 */
const ENDPOINTS = {
  RETROS: "/retros/",
  RETRO_DETAIL: (id: number) => `/retros/${id}/`,
  ADD_ITEM: (id: number) => `/retros/${id}/add_item/`,
  VOTE_ITEM: (retroId: number, itemId: number) =>
    `/retros/${retroId}/items/${itemId}/vote/`,
  JOIN: (id: number) => `/retros/${id}/join/`,
  LEAVE: (id: number) => `/retros/${id}/leave/`,
  METRICS: "/retros/metrics/",
  TEMPLATES: "/retro-templates/",
  TEMPLATE_DETAIL: (id: number) => `/retro-templates/${id}/`,
  TEMPLATE_SET_DEFAULT: (id: number) => `/retro-templates/${id}/set_default/`,
};

/**
 * Serviço de Retrospectivas
 */
export const retrosService = {
  /**
   * Lista todas as retros com filtros e paginação
   */
  async getAll(
    params?: RetroFilters
  ): Promise<PaginatedResponse<RetroListItem>> {
    const response = await api.get<PaginatedResponse<RetroListItem>>(
      ENDPOINTS.RETROS,
      { params }
    );
    return response.data;
  },

  /**
   * Busca detalhes de uma retro específica
   */
  async getById(id: number): Promise<RetroDetail> {
    const response = await api.get<RetroDetail>(ENDPOINTS.RETRO_DETAIL(id));
    return response.data;
  },

  /**
   * Cria uma nova retrospectiva
   */
  async create(data: RetroFormData): Promise<RetroDetail> {
    const response = await api.post<RetroDetail>(ENDPOINTS.RETROS, data);
    return response.data;
  },

  /**
   * Atualiza uma retrospectiva existente
   */
  async update(id: number, data: Partial<RetroFormData>): Promise<RetroDetail> {
    const response = await api.patch<RetroDetail>(
      ENDPOINTS.RETRO_DETAIL(id),
      data
    );
    return response.data;
  },

  /**
   * Deleta uma retrospectiva
   */
  async delete(id: number): Promise<void> {
    await api.delete(ENDPOINTS.RETRO_DETAIL(id));
  },

  /**
   * Adiciona um novo item à retrospectiva
   */
  async addItem(retroId: number, data: RetroItemFormData): Promise<RetroItem> {
    const response = await api.post<RetroItem>(
      ENDPOINTS.ADD_ITEM(retroId),
      data
    );
    return response.data;
  },

  /**
   * Vota ou remove voto de um item (toggle)
   * @returns Estado final do voto e contagem total
   */
  async voteItem(
    retroId: number,
    itemId: number
  ): Promise<VoteItemResponse> {
    const response = await api.post<VoteItemResponse>(
      ENDPOINTS.VOTE_ITEM(retroId, itemId)
    );
    return response.data;
  },

  /**
   * Adiciona o usuário atual como participante
   */
  async join(retroId: number): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      ENDPOINTS.JOIN(retroId)
    );
    return response.data;
  },

  /**
   * Remove o usuário atual como participante
   */
  async leave(retroId: number): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      ENDPOINTS.LEAVE(retroId)
    );
    return response.data;
  },

  /**
   * Busca métricas agregadas sobre retrospectivas
   * @param filters - Filtros opcionais (status, autor, data_inicio, data_fim)
   */
  async getMetrics(filters?: RetroMetricsFilters): Promise<RetroMetrics> {
    const response = await api.get<RetroMetrics>(ENDPOINTS.METRICS, {
      params: filters,
    });
    return response.data;
  },
};

/**
 * Serviço de Templates de Retro
 */
export const retroTemplatesService = {
  /**
   * Lista todos os templates disponíveis
   */
  async getAll(params?: { page?: number }): Promise<PaginatedResponse<RetroTemplate>> {
    const response = await api.get<PaginatedResponse<RetroTemplate>>(ENDPOINTS.TEMPLATES, { params });
    return response.data;
  },

  /**
   * Busca detalhes de um template específico
   */
  async getById(id: number): Promise<RetroTemplate> {
    const response = await api.get<RetroTemplate>(
      ENDPOINTS.TEMPLATE_DETAIL(id)
    );
    return response.data;
  },

  /**
   * Cria um novo template (apenas admin)
   */
  async create(data: Partial<RetroTemplate>): Promise<RetroTemplate> {
    const response = await api.post<RetroTemplate>(ENDPOINTS.TEMPLATES, data);
    return response.data;
  },

  /**
   * Atualiza um template existente (apenas admin, não-sistema)
   */
  async update(
    id: number,
    data: Partial<RetroTemplate>
  ): Promise<RetroTemplate> {
    const response = await api.patch<RetroTemplate>(
      ENDPOINTS.TEMPLATE_DETAIL(id),
      data
    );
    return response.data;
  },

  /**
   * Deleta um template (apenas admin, não-sistema, sem retros vinculadas)
   */
  async delete(id: number): Promise<void> {
    await api.delete(ENDPOINTS.TEMPLATE_DETAIL(id));
  },

  /**
   * Define um template como padrão (apenas admin)
   */
  async setDefault(id: number): Promise<RetroTemplate> {
    const response = await api.post<RetroTemplate>(
      ENDPOINTS.TEMPLATE_SET_DEFAULT(id)
    );
    return response.data;
  },
};

export default retrosService;
