from rest_framework import serializers
from .models import InternshipPlacement, PlacementDocument

# File validation constants
ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB


class PlacementDocumentSerializer(serializers.ModelSerializer):
    """Serializer for reading placement documents"""
    file_url = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = PlacementDocument
        fields = [
            'id', 'placement', 'document_type', 'document_type_display',
            'file_url', 'original_filename', 'file_size', 'mime_type',
            'description', 'uploaded_at', 'uploaded_by', 'uploaded_by_name'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'file_size', 'mime_type', 'original_filename']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class PlacementDocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading placement documents."""

    class Meta:
        model = PlacementDocument
        fields = ['placement', 'document_type', 'file', 'description']

    def validate_file(self, value):
        # Validate file size
        if value.size > MAX_DOCUMENT_SIZE:
            raise serializers.ValidationError(
                f"File size cannot exceed {MAX_DOCUMENT_SIZE // (1024*1024)}MB."
            )

        # Validate file type
        content_type = value.content_type
        if content_type not in ALLOWED_DOCUMENT_TYPES:
            raise serializers.ValidationError(
                "File type not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX"
            )

        return value

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['mime_type'] = file.content_type
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class PlacementSerializer(serializers.ModelSerializer):
    """Serializer for InternshipPlacement model."""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_number = serializers.CharField(source='student.student_number', read_only=True)
    workplace_supervisor_name = serializers.CharField(source='workplace_supervisor.full_name', read_only=True, default='')
    academic_supervisor_name = serializers.CharField(source='academic_supervisor.full_name', read_only=True, default='')
    documents = PlacementDocumentSerializer(many=True, read_only=True)
    documents_count = serializers.IntegerField(source='documents.count', read_only=True)
    logs_summary = serializers.SerializerMethodField()

    class Meta:
        model = InternshipPlacement
        fields = [
            'id', 'student', 'student_name', 'student_number', 'workplace_supervisor', 'workplace_supervisor_name',
            'academic_supervisor', 'academic_supervisor_name', 'organization', 'department',
            'position', 'start_date', 'end_date', 'status', 'created_at', 'updated_at',
            'documents', 'documents_count', 'logs_summary'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_logs_summary(self, obj):
        """Get summary of logs for this placement."""
        from logbook.models import WeeklyLog

        logs = WeeklyLog.objects.filter(placement=obj)

        return {
            'total': logs.count(),
            'approved': logs.filter(status='approved').count(),
            'pending_review': logs.filter(status__in=['submitted', 'reviewed']).count(),
            'returned': logs.filter(status='returned').count(),
            'draft': logs.filter(status='draft').count(),
        }


class StudentPlacementCreateSerializer(serializers.ModelSerializer):
    """Serializer for students to create their own placement."""

    class Meta:
        model = InternshipPlacement
        fields = [
            'organization', 'department', 'position', 'start_date', 'end_date'
        ]

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] >= attrs['end_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })
        return attrs

    def create(self, validated_data):
        """Auto-assign student and set status to pending."""
        validated_data['student'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)
