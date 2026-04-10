from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class LogbookConfig(AppConfig):
    name = 'logbook'
    // This makes 'Logbook' appear as 'Logbook Management' in the Admin UI
    verbose_name = _('Logbook Management')
    default_auto_field = 'django.db.models.BigAutoField'
