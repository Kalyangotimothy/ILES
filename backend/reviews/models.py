from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg


class SupervisorReview(models.Model):
    """Review of weekly logs by both workplace and academic supervisors."""

    class Decision(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        RETURNED = 'returned', 'Returned for Revision'

    class ReviewerType(models.TextChoices):
        WORKPLACE = 'workplace', 'Workplace Supervisor'
        ACADEMIC = 'academic', 'Academic Supervisor'

    log = models.ForeignKey(
        'logbook.WeeklyLog',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    reviewer_type = models.CharField(
        max_length=20,
        choices=ReviewerType.choices,
        default=ReviewerType.WORKPLACE,
        help_text="Type of supervisor giving this review"
    )
    decision = models.CharField(
        max_length=20,
        choices=Decision.choices
    )
    comments = models.TextField(help_text="Review comments and feedback")
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score for this log (0-100%)"
    )
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supervisor_reviews'
        ordering = ['-reviewed_at']
        # Each supervisor type can only review a log once
        unique_together = ['log', 'reviewer_type']

    def __str__(self):
        return f"{self.get_reviewer_type_display()} review by {self.reviewer.full_name} for {self.log}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_log_status()
        self._update_log_score()

    def _update_log_score(self):
        """Update the log's computed score based on all reviews."""
        log = self.log
        reviews = log.reviews.filter(decision=self.Decision.APPROVED)
        if reviews.exists():
            avg_score = reviews.aggregate(avg=Avg('score'))['avg']
            log.computed_score = avg_score
            log.save(update_fields=['computed_score'])

    @classmethod
    def calculate_placement_logbook_score(cls, placement):
        """
        Calculate the average logbook score for a placement.
        Only considers approved logs with reviews.
        Returns the average score across all approved log reviews.
        """
        from logbook.models import WeeklyLog

        # Get all approved logs for this placement
        approved_logs = WeeklyLog.objects.filter(
            placement=placement,
            status='approved'
        )

        if not approved_logs.exists():
            return None

        # Calculate average of all log scores
        total_score = 0
        count = 0

        for log in approved_logs:
            if log.computed_score is not None:
                total_score += float(log.computed_score)
                count += 1

        if count == 0:
            return None

        return round(total_score / count, 2)

    def _update_log_status(self):
        """Update log status based on all reviews."""
        log = self.log
        reviews = log.reviews.all()

        # Check for any returned decision
        if reviews.filter(decision=self.Decision.RETURNED).exists():
            log.status = 'returned'
            log.save()
            return

        # Check if both supervisors have approved
        workplace_approved = reviews.filter(
            reviewer_type=self.ReviewerType.WORKPLACE,
            decision=self.Decision.APPROVED
        ).exists()
        academic_approved = reviews.filter(
            reviewer_type=self.ReviewerType.ACADEMIC,
            decision=self.Decision.APPROVED
        ).exists()

        if workplace_approved and academic_approved:
            log.status = 'approved'
        elif workplace_approved or academic_approved:
            log.status = 'reviewed'

        log.save()


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
