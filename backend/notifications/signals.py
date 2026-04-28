from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from logbook.models import WeeklyLog
from reviews.models import SupervisorReview
from placements.models import InternshipPlacement
from .services import NotificationService


# Track old status for placement status change notifications
_placement_old_status = {}


@receiver(pre_save, sender=InternshipPlacement)
def track_placement_status(sender, instance, **kwargs):
    """Track old status before save."""
    if instance.pk:
        try:
            old_instance = InternshipPlacement.objects.get(pk=instance.pk)
            _placement_old_status[instance.pk] = old_instance.status
        except InternshipPlacement.DoesNotExist:
            pass


@receiver(post_save, sender=WeeklyLog)
def notify_log_submitted(sender, instance, created, **kwargs):
    """Send notification when a log is submitted."""
    if instance.status == 'submitted':
        # Check if this is a new submission (status just changed to submitted)
        # We'll trigger this when the log is submitted via the submit() method
        pass  # Handled in the submit method


@receiver(post_save, sender=SupervisorReview)
def notify_log_reviewed(sender, instance, created, **kwargs):
    """Send notification when a log is reviewed."""
    if created:
        NotificationService.notify_log_reviewed(instance)

        # Check if log is now fully approved
        log = instance.log
        if log.status == 'approved':
            NotificationService.notify_log_fully_approved(log)


@receiver(post_save, sender=InternshipPlacement)
def notify_placement_changes(sender, instance, created, **kwargs):
    """Send notifications for placement changes."""
    if created:
        # New placement - notify about supervisor assignments if any
        if instance.workplace_supervisor or instance.academic_supervisor:
            NotificationService.notify_placement_assigned(instance)
    else:
        # Check for status change
        old_status = _placement_old_status.pop(instance.pk, None)
        if old_status and old_status != instance.status:
            NotificationService.notify_placement_status_changed(
                instance, old_status, instance.status
            )

        # Check for new supervisor assignments
        # This would need more sophisticated tracking, simplified for now
