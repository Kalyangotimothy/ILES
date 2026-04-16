from rest_framework import serializers
from .models import WeeklyLog, LogAttachment, LogTemplate

# File validation constants
ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024  # 5MB


class LogAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for reading log attachments."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LogAttachment
        fields = ['id', 'log', 'file_url', 'original_filename', 'file_size', 'mime_type', 'caption', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_size', 'mime_type', 'original_filename']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class LogAttachmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading log attachments."""

    class Meta:
        model = LogAttachment
        fields = ['log', 'file', 'caption']

    def validate_file(self, value):
        if value.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError(
                f"File size cannot exceed {MAX_ATTACHMENT_SIZE // (1024*1024)}MB."
            )

        if value.content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise serializers.ValidationError(
                "File type not allowed. Allowed types: PDF, JPEG, PNG, GIF"
            )

        return value

    def validate(self, attrs):
        log = attrs.get('log')
        if log and log.status not in ['draft', 'returned']:
            raise serializers.ValidationError({
                'log': 'Cannot add attachments to submitted or approved logs.'
            })
        return attrs

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['mime_type'] = file.content_type
        return super().create(validated_data)


class LogTemplateSerializer(serializers.ModelSerializer):
    """Serializer for log templates with guided prompts."""

    class Meta:
        model = LogTemplate
        fields = [
            'id', 'name', 'description', 'activities_prompts',
            'challenges_prompts', 'skills_prompts', 'is_default',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WeeklyLogSerializer(serializers.ModelSerializer):
    """Serializer for WeeklyLog model."""
    student_name = serializers.CharField(source='placement.student.full_name', read_only=True)
    organization = serializers.CharField(source='placement.organization', read_only=True)
    attachments = LogAttachmentSerializer(many=True, read_only=True)
    attachments_count = serializers.IntegerField(source='attachments.count', read_only=True)

    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities', 'challenges', 'skills_learned', 'hours_worked',
            'status', 'submitted_at', 'is_late', 'created_at', 'updated_at',
            'student_name', 'organization', 'attachments', 'attachments_count'
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
