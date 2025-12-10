import logging
from talks.models import Notification
from .base import AbstractNotificationService, NotificationContext

logger = logging.getLogger(__name__)


class DatabaseNotificationService(AbstractNotificationService):
    def send(self, context: NotificationContext) -> bool:
        try:
            Notification.objects.create(
                user=context.recipient,
                tipo=context.notification_type,
                mensagem=context.message,
                idea=context.idea,
                **context.metadata,
            )
            logger.info(
                f"Notificação criada: {context.notification_type} para {context.recipient.username}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Erro ao criar notificação: {context.notification_type} "
                f"para {context.recipient.username}: {str(e)}"
            )
            return False

    def can_send(self, context: NotificationContext) -> bool:
        return context.recipient is not None
