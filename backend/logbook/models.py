from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class WeeklyLog(models.Model):
    """Weekly activity log submitted by student interns."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        RETURNED = 'returned', 'Returned'
        REVIEWED = 'reviewed', 'Reviewed'
        APPROVED = 'approved', 'Approved'

    placement = models.ForeignKey(
        'placements.InternshipPlacement',
        on_delete=models.CASCADE,
        related_name='weekly_logs'
    )
    week_number = models.PositiveIntegerField()
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    activities = models.TextField(help_text="Activities performed during the week")
    challenges = models.TextField(blank=True, help_text="Challenges encountered")
    skills_learned = models.TextField(blank=True, help_text="Skills learned or developed")
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_late = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'weekly_logs'
        ordering = ['placement', 'week_number']
        unique_together = ['placement', 'week_number']

    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student.full_name}"

    def clean(self):
        if self.week_start_date and self.week_end_date:
            if self.week_start_date >= self.week_end_date:
                raise ValidationError("Week end date must be after start date.")

    def submit(self):
        """Submit the log for review."""
        if self.status != self.Status.DRAFT and self.status != self.Status.RETURNED:
            raise ValidationError("Only draft or returned logs can be submitted.")
        self.status = self.Status.SUBMITTED
        self.submitted_at = timezone.now()
        # Check if submission is late (after week end + 2 days grace period)
        deadline = self.week_end_date + timezone.timedelta(days=2)
        if timezone.now().date() > deadline:
            self.is_late = True
        self.save()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
