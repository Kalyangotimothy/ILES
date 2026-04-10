from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class InternshipPlacement(models.Model):
    """Manages internship placement assignments."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placements_as_student',
        limit_choices_to={'role': 'student'}
    )
    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placements_as_workplace_supervisor',
        limit_choices_to={'role': 'workplace_supervisor'}
    )
    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placements_as_academic_supervisor',
        limit_choices_to={'role': 'academic_supervisor'}
    )
    organization = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    position = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'internship_placements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} at {self.organization}"

    def clean(self):
        if self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError("End date must be after start date.")

            # Check for overlapping placements
            overlapping = InternshipPlacement.objects.filter(
                student=self.student,
                status__in=[self.Status.PENDING, self.Status.ACTIVE]
            ).exclude(pk=self.pk).filter(
                start_date__lt=self.end_date,
                end_date__gt=self.start_date
            )
            if overlapping.exists():
                raise ValidationError(
                    "This student already has an overlapping placement."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
