import logging
from django.dispatch import receiver
from .signals import (
    idea_voted,
    volunteer_registered,
    idea_rescheduled,
    comment_created,
)
from .services.database import DatabaseNotificationService
from .services.base import NotificationContext
from .templates.messages import TEMPLATES

logger = logging.getLogger(__name__)


class NotificationDispatcher:
    def __init__(self):
        self.services = [
            DatabaseNotificationService(),
            # EmailNotificationService(),
            # PushNotificationService(),
        ]

    def dispatch(self, context: NotificationContext) -> list:
        results = []
        for service in self.services:
            if service.can_send(context):
                try:
                    success = service.send(context)
                    results.append((service.__class__.__name__, success))
                except Exception as e:
                    logger.error(
                        f"Erro no serviço {service.__class__.__name__}: {str(e)}"
                    )
                    results.append((service.__class__.__name__, False))
        return results


dispatcher = NotificationDispatcher()

@receiver(idea_voted)
def handle_idea_voted(sender, idea, user, voted, **kwargs):
    if not voted or idea.autor == user:
        return

    message = TEMPLATES["voto"](user, idea)
    context = NotificationContext(
        recipient=idea.autor,
        notification_type="voto",
        message=message,
        idea=idea,
    )
    dispatcher.dispatch(context)


@receiver(volunteer_registered)
def handle_volunteer_registered(sender, idea, user, **kwargs):
    if idea.autor == user:
        return

    message = TEMPLATES["voluntario"](user, idea)
    context = NotificationContext(
        recipient=idea.autor,
        notification_type="voluntario",
        message=message,
        idea=idea,
    )
    dispatcher.dispatch(context)


@receiver(idea_rescheduled)
def handle_idea_rescheduled(sender, idea, user, **kwargs):
    recipients = set()
    if idea.autor != user:
        recipients.add(idea.autor)
    if idea.apresentador and idea.apresentador != user:
        recipients.add(idea.apresentador)

    message = TEMPLATES["agendamento"](user, idea)
    for recipient in recipients:
        context = NotificationContext(
            recipient=recipient,
            notification_type="agendamento",
            message=message,
            idea=idea,
        )
        dispatcher.dispatch(context)


@receiver(comment_created)
def handle_comment_created(sender, comment, user, **kwargs):
    if comment.idea.autor == user:
        return

    message = TEMPLATES["comentario"](user, comment.idea)
    context = NotificationContext(
        recipient=comment.idea.autor,
        notification_type="comentario",
        message=message,
        idea=comment.idea,
        metadata={"comment_id": comment.id},
    )
    dispatcher.dispatch(context)
