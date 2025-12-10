from django.apps import AppConfig


class TalksConfig(AppConfig):
    name = "talks"

    def ready(self):
        import talks.notifications.handlers  # noqa
