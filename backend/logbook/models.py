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
    computed_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Average score from supervisor reviews (0-100%)"
    )
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
                raise ValidationError("Week end date must be after start date")

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

        # Send notification to supervisors
        from notifications.services import NotificationService
        NotificationService.notify_log_submitted(self)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


def log_attachment_upload_path(instance, filename):
    """Generate upload path for log attachments."""
    return f"logs/{instance.log.id}/attachments/{filename}"


class LogAttachment(models.Model):
    """Stores file attachments for weekly logs."""

    log = models.ForeignKey(
        'WeeklyLog',
        on_delete=models.CASCADE,        
        related_name='attachments'
    )
    file = models.FileField(upload_to=log_attachment_upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)    
    caption = models.CharField(max_length=255, blank=True, help_text="Brief description of the attachment")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'log_attachments'
        ordering = ['uploaded_at']

    def __str__(self):
        return f"Attachment: {self.original_filename}"


class LogTemplate(models.Model):
    """Stores structured templates with guided prompts for log entries."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    # JSON field to store structured prompts
    activities_prompts = models.JSONField(
        default=list,
        help_text="List of guiding prompts for activities section"
    )
    challenges_prompts = models.JSONField(
        default=list,
        help_text="List of guiding prompts for challenges section"
    )
    skills_prompts = models.JSONField(
        default=list,
        help_text="List of guiding prompts for skills learned section"        
    )

    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'log_templates'
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default template
        if self.is_default:
            LogTemplate.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
