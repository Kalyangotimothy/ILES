from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Custom user model with role-based access control."""

    class Role(models.TextChoices):
        STUDENT = 'student', 'Student Intern'
        WORKPLACE_SUPERVISOR = 'workplace_supervisor', 'Workplace Supervisor'
        ACADEMIC_SUPERVISOR = 'academic_supervisor', 'Academic Supervisor'
        ADMIN = 'admin', 'Administrator'

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.STUDENT
    )
    phone = models.CharField(max_length=20, blank=True)
    organization = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_workplace_supervisor(self):
        return self.role == self.Role.WORKPLACE_SUPERVISOR

    @property
    def is_academic_supervisor(self):
        return self.role == self.Role.ACADEMIC_SUPERVISOR

    @property
    def is_administrator(self):
        return self.role == self.Role.ADMIN
