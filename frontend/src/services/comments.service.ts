import api from "./api";
import type { Comment, MessageResponse } from "../types";

/**
 * Serviço para gerenciar comentários
 */
class CommentsService {
  /**
   * Lista comentários de uma ideia
   */
  async getComments(ideaId: number): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/api/comments/?idea=${ideaId}`);
    return response.data;
  }

  /**
   * Cria um novo comentário
   */
  async createComment(
    ideaId: number,
    conteudo: string,
    parentId?: number,
  ): Promise<Comment> {
    const response = await api.post<Comment>("/api/comments/", {
      idea: ideaId,
      conteudo,
      parent: parentId || null,
    });
    return response.data;
  }

  /**
   * Atualiza um comentário
   */
  async updateComment(id: number, conteudo: string): Promise<Comment> {
    const response = await api.patch<Comment>(`/api/comments/${id}/`, {
      conteudo,
    });
    return response.data;
  }

  /**
   * Deleta um comentário
   */
  async deleteComment(id: number): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(`/api/comments/${id}/`);
    return response.data;
  }

  /**
   * Obtém um comentário específico
   */
  async getComment(id: number): Promise<Comment> {
    const response = await api.get<Comment>(`/api/comments/${id}/`);
    return response.data;
  }
}

export const commentsService = new CommentsService();
export default commentsService;
