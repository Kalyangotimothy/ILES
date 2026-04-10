from django.db import models
from django.conf import settings


class SupervisorReview(models.Model):
    """Review of weekly logs by workplace supervisors."""

    class Decision(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        RETURNED = 'returned', 'Returned for Revision'

    log = models.ForeignKey(
        'logbook.WeeklyLog',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        limit_choices_to={'role': 'workplace_supervisor'}
    )
    decision = models.CharField(
        max_length=20,
        choices=Decision.choices
    )
    comments = models.TextField(help_text="Review comments and feedback")
    rating = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional rating out of 10"
    )
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supervisor_reviews'
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"Review by {self.reviewer.full_name} for {self.log}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update log status based on decision
        if self.decision == self.Decision.APPROVED:
            self.log.status = 'reviewed'
        else:
            self.log.status = 'returned'
        self.log.save()


class AuditLog(models.Model):
    """Generic audit trail for tracking all state changes."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_id = models.PositiveIntegerField()
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.target_model}#{self.target_id} by {self.actor}"
