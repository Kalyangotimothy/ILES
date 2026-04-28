from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import Notification, NotificationPreference


class NotificationService:
    """Service for sending in-app and email notifications."""

    @staticmethod
    def get_or_create_preferences(user):
        """Get or create notification preferences for a user."""
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return prefs

    @classmethod
    def notify_log_submitted(cls, log):
        """Notify supervisors when a student submits a log."""
        placement = log.placement
        student_name = placement.student.full_name

        # Notify workplace supervisor
        if placement.workplace_supervisor:
            cls._create_notification(
                recipient=placement.workplace_supervisor,
                notification_type=Notification.NotificationType.LOG_SUBMITTED,
                title="New Log Submitted",
                message=f"{student_name} has submitted Week {log.week_number} log for review.",
                related_log=log,
                related_placement=placement,
                email_subject=f"[ILES] New Log Submitted by {student_name}",
                email_template='log_submitted'
            )

        # Notify academic supervisor
        if placement.academic_supervisor:
            cls._create_notification(
                recipient=placement.academic_supervisor,
                notification_type=Notification.NotificationType.LOG_SUBMITTED,
                title="New Log Submitted",
                message=f"{student_name} has submitted Week {log.week_number} log for review.",
                related_log=log,
                related_placement=placement,
                email_subject=f"[ILES] New Log Submitted by {student_name}",
                email_template='log_submitted'
            )

    @classmethod
    def notify_log_reviewed(cls, review):
        """Notify student when their log is reviewed."""
        log = review.log
        student = log.placement.student
        reviewer_name = review.reviewer.full_name
        reviewer_type = review.get_reviewer_type_display()

        if review.decision == 'approved':
            notification_type = Notification.NotificationType.LOG_REVIEWED
            title = "Log Reviewed"
            message = f"Your Week {log.week_number} log has been approved by {reviewer_name} ({reviewer_type})."
        else:
            notification_type = Notification.NotificationType.LOG_RETURNED
            title = "Log Returned for Revision"
            message = f"Your Week {log.week_number} log has been returned by {reviewer_name} ({reviewer_type}). Please review the feedback and resubmit."

        cls._create_notification(
            recipient=student,
            notification_type=notification_type,
            title=title,
            message=message,
            related_log=log,
            related_placement=log.placement,
            email_subject=f"[ILES] {title}",
            email_template='log_reviewed',
            extra_context={'review': review}
        )

    @classmethod
    def notify_log_fully_approved(cls, log):
        """Notify student when log is fully approved by both supervisors."""
        student = log.placement.student

        cls._create_notification(
            recipient=student,
            notification_type=Notification.NotificationType.LOG_APPROVED,
            title="Log Fully Approved",
            message=f"Your Week {log.week_number} log has been approved by both supervisors.",
            related_log=log,
            related_placement=log.placement,
            email_subject=f"[ILES] Week {log.week_number} Log Fully Approved",
            email_template='log_approved'
        )

    @classmethod
    def notify_placement_assigned(cls, placement):
        """Notify when a placement is assigned supervisors."""
        student = placement.student

        # Notify student about supervisor assignments
        supervisors = []
        if placement.workplace_supervisor:
            supervisors.append(f"Workplace: {placement.workplace_supervisor.full_name}")
        if placement.academic_supervisor:
            supervisors.append(f"Academic: {placement.academic_supervisor.full_name}")

        if supervisors:
            cls._create_notification(
                recipient=student,
                notification_type=Notification.NotificationType.PLACEMENT_ASSIGNED,
                title="Supervisors Assigned",
                message=f"Supervisors have been assigned to your placement: {', '.join(supervisors)}",
                related_placement=placement,
                email_subject="[ILES] Supervisors Assigned to Your Placement",
                email_template='placement_assigned'
            )

    @classmethod
    def notify_placement_status_changed(cls, placement, old_status, new_status):
        """Notify when placement status changes."""
        student = placement.student

        status_messages = {
            'active': "Your placement has been activated. You can now start submitting weekly logs.",
            'completed': "Congratulations! Your placement has been marked as completed.",
            'cancelled': "Your placement has been cancelled. Please contact your supervisor for more information.",
        }

        message = status_messages.get(new_status, f"Your placement status has been updated to {new_status}.")

        cls._create_notification(
            recipient=student,
            notification_type=Notification.NotificationType.PLACEMENT_STATUS,
            title="Placement Status Updated",
            message=message,
            related_placement=placement,
            email_subject=f"[ILES] Placement Status: {new_status.title()}",
            email_template='placement_status'
        )

    @classmethod
    def _create_notification(cls, recipient, notification_type, title, message,
                             related_log=None, related_placement=None,
                             email_subject=None, email_template=None, extra_context=None):
        """Create in-app notification and optionally send email."""

        # Create in-app notification
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            related_log=related_log,
            related_placement=related_placement
        )

        # Send email notification
        if email_subject and recipient.email:
            try:
                cls._send_email(
                    recipient=recipient,
                    subject=email_subject,
                    template=email_template,
                    context={
                        'user': recipient,
                        'title': title,
                        'message': message,
                        'log': related_log,
                        'placement': related_placement,
                        **(extra_context or {})
                    }
                )
                notification.email_sent = True
                notification.save()
            except Exception as e:
                print(f"Failed to send email notification: {e}")

        return notification

    @classmethod
    def _send_email(cls, recipient, subject, template, context):
        """Send email notification."""
        # Simple plain text email for now
        message = f"""
Hello {recipient.full_name},

{context.get('message', '')}

---
This is an automated notification from ILES (Internship Logbook and Evaluation System).
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@iles.com',
            recipient_list=[recipient.email],
            fail_silently=True
        )
