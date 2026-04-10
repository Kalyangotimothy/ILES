from rest_framework import serializers
from .models import InternshipPlacement
from users.serializers import UserSerializer


class PlacementSerializer(serializers.ModelSerializer):
    """Serializer for InternshipPlacement model."""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    workplace_supervisor_name = serializers.CharField(source='workplace_supervisor.full_name', read_only=True)
    academic_supervisor_name = serializers.CharField(source='academic_supervisor.full_name', read_only=True)

    class Meta:
        model = InternshipPlacement
        fields = [
            'id', 'student', 'student_name', 'workplace_supervisor', 'workplace_supervisor_name',
            'academic_supervisor', 'academic_supervisor_name', 'organization', 'department',
            'position', 'start_date', 'end_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
