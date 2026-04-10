from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


class EvaluationCriteria(models.Model):
    """Configurable evaluation criteria for academic evaluations."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    max_score = models.PositiveIntegerField(default=100)
    weight_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evaluation_criteria'
        verbose_name_plural = 'Evaluation Criteria'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.weight_percent}%)"


class Evaluation(models.Model):
    """Academic evaluation of an intern's placement."""

    class Grade(models.TextChoices):
        A = 'A', 'A (Distinction)'
        B = 'B', 'B (Credit)'
        C = 'C', 'C (Pass)'
        D = 'D', 'D (Marginal Pass)'
        F = 'F', 'F (Fail)'

    placement = models.OneToOneField(
        'placements.InternshipPlacement',
        on_delete=models.CASCADE,
        related_name='evaluation'
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_given',
        limit_choices_to={'role': 'academic_supervisor'}
    )
    supervisor_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Workplace supervisor component (40%)"
    )
    academic_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Academic supervisor component (30%)"
    )
    logbook_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Logbook component (30%)"
    )
    total_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    grade = models.CharField(
        max_length=1,
        choices=Grade.choices,
        blank=True
    )
    comments = models.TextField(blank=True)
    is_locked = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluations'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Evaluation for {self.placement.student.full_name}"

    def calculate_total_score(self):
        """Calculate weighted total score."""
        # Formula: (Supervisor x 40%) + (Academic x 30%) + (Logbook x 30%)
        total = (
            float(self.supervisor_score) * 0.40 +
            float(self.academic_score) * 0.30 +
            float(self.logbook_score) * 0.30
        )
        return round(total, 2)

    def determine_grade(self, score):
        """Determine letter grade based on score."""
        if score >= 80:
            return self.Grade.A
        elif score >= 70:
            return self.Grade.B
        elif score >= 60:
            return self.Grade.C
        elif score >= 50:
            return self.Grade.D
        else:
            return self.Grade.F

    def clean(self):
        if self.is_locked:
            raise ValidationError("This evaluation is locked and cannot be modified.")

    def save(self, *args, **kwargs):
        # Auto-calculate total score and grade
        self.total_score = self.calculate_total_score()
        self.grade = self.determine_grade(self.total_score)
        super().save(*args, **kwargs)


class EvaluationScore(models.Model):
    """Individual criterion scores within an evaluation."""

    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name='criterion_scores'
    )
    criteria = models.ForeignKey(
        EvaluationCriteria,
        on_delete=models.CASCADE,
        related_name='scores'
    )
    score_awarded = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        db_table = 'evaluation_scores'
        unique_together = ['evaluation', 'criteria']

    def __str__(self):
        return f"{self.criteria.name}: {self.score_awarded}"

    def clean(self):
        if self.score_awarded > self.criteria.max_score:
            raise ValidationError(
                f"Score cannot exceed maximum of {self.criteria.max_score}."
            )
