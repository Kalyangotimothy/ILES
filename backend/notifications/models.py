from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notifications for users."""

    class NotificationType(models.TextChoices):
        LOG_SUBMITTED = 'log_submitted', 'Log Submitted'
        LOG_ASSIGNED = 'log_assigned', 'Log Assigned'
        LOG_REVIEWED = 'log_reviewed', 'Log Reviewed'
        LOG_APPROVED = 'log_approved', 'Log Approved'
        LOG_RETURNED = 'log_returned', 'Log Returned'
        PLACEMENT_ASSIGNED = 'placement_assigned', 'Placement Assigned'
        PLACEMENT_STATUS = 'placement_status', 'Placement Status Updated'
        GENERAL = 'general', 'General'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )
    title = models.CharField(max_length=255)
    message = models.TextField()

    # Optional reference to related objects
    related_log = models.ForeignKey(
        'logbook.WeeklyLog',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_placement = models.ForeignKey(
        'placements.InternshipPlacement',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )

    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.recipient.full_name}"


class NotificationPreference(models.Model):
    """User preferences for notifications."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )

    # Email notification preferences
    email_log_submitted = models.BooleanField(default=True)
    email_log_reviewed = models.BooleanField(default=True)
    email_placement_updates = models.BooleanField(default=True)

    # In-app notification preferences
    inapp_log_submitted = models.BooleanField(default=True)
    inapp_log_reviewed = models.BooleanField(default=True)
    inapp_placement_updates = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"Notification preferences for {self.user.full_name}"
