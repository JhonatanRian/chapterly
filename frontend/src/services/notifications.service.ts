import api from "./api";
import type {
  Notification,
  PaginatedResponse,
  MessageResponse,
} from "../types";
import { ENDPOINTS } from "../utils/constants";

/**
 * Serviço para gerenciar notificações
 */
class NotificationsService {
  /**
   * Lista notificações do usuário
   */
  async getNotifications(
    page: number = 1,
    unreadOnly: boolean = false,
  ): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (unreadOnly) {
      params.append("lido", "false");
    }

    const response = await api.get<PaginatedResponse<Notification>>(
      `${ENDPOINTS.NOTIFICATIONS}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Obtém uma notificação específica
   */
  async getNotification(id: number): Promise<Notification> {
    const response = await api.get<Notification>(
      `${ENDPOINTS.NOTIFICATIONS}${id}/`,
    );
    return response.data;
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.patch<Notification>(
      `${ENDPOINTS.NOTIFICATIONS}${id}/`,
      {
        lido: true,
      },
    );
    return response.data;
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ,
    );
    return response.data;
  }

  /**
   * Deleta uma notificação
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.NOTIFICATIONS}${id}/`);
  }

  /**
   * Obtém contador de notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.getNotifications(1, true);
    return response.count;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
