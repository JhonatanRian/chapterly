
from typing import Any, Callable, Dict


class MessageTemplate:
    
    @staticmethod
    def vote_created(user: Any, idea: Any) -> str:
        return f"{user.username} votou na sua ideia '{idea.titulo}'"
    
    @staticmethod
    def volunteer_registered(user: Any, idea: Any) -> str:
        return f"{user.username} se voluntariou para apresentar '{idea.titulo}'"
    
    @staticmethod
    def idea_rescheduled(user: Any, idea: Any) -> str:
        return f"{user.username} reagendou '{idea.titulo}'"
    
    @staticmethod
    def comment_created(user: Any, idea: Any) -> str:
        return f"{user.username} comentou em '{idea.titulo}'"


TEMPLATES: Dict[str, Callable[[Any, Any], str]] = {
    "voto": MessageTemplate.vote_created,
    "voluntario": MessageTemplate.volunteer_registered,
    "agendamento": MessageTemplate.idea_rescheduled,
    "comentario": MessageTemplate.comment_created,
}


def get_message(notification_type: str, user: Any, idea: Any) -> str:
    template_fn = TEMPLATES[notification_type]
    return template_fn(user, idea)
