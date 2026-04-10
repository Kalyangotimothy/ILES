from rest_framework import serializers
from .models import WeeklyLog


class WeeklyLogSerializer(serializers.ModelSerializer):
    """Serializer for WeeklyLog model."""
    student_name = serializers.CharField(source='placement.student.full_name', read_only=True)
    organization = serializers.CharField(source='placement.organization', read_only=True)

    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities', 'challenges', 'skills_learned', 'hours_worked',
            'status', 'submitted_at', 'is_late', 'created_at', 'updated_at',
            'student_name', 'organization'
        ]
        read_only_fields = ['id', 'status', 'submitted_at', 'is_late', 'created_at', 'updated_at']


class WeeklyLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating WeeklyLog."""

    class Meta:
        model = WeeklyLog
        fields = [
            'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities', 'challenges', 'skills_learned', 'hours_worked'
        ]

    def validate(self, attrs):
        if attrs.get('week_start_date') and attrs.get('week_end_date'):
            if attrs['week_start_date'] >= attrs['week_end_date']:
                raise serializers.ValidationError({
                    'week_end_date': 'Week end date must be after start date.'
                })
        return attrs
