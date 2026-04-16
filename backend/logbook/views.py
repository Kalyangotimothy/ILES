from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q

from .models import WeeklyLog, LogAttachment, LogTemplate
from .serializers import (
    WeeklyLogSerializer, WeeklyLogCreateSerializer,
    LogAttachmentSerializer, LogAttachmentCreateSerializer,
    LogTemplateSerializer
)


class WeeklyLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing weekly logs."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeeklyLogCreateSerializer
        return WeeklyLogSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'student':
            # Students see only their own logs
            return WeeklyLog.objects.filter(
                placement__student=user
            ).select_related('placement', 'placement__student')

        elif user.role in ['workplace_supervisor', 'academic_supervisor']:
            # Supervisors see logs from their assigned placements
            if user.role == 'workplace_supervisor':
                return WeeklyLog.objects.filter(
                    placement__workplace_supervisor=user
                ).select_related('placement', 'placement__student')
            else:
                return WeeklyLog.objects.filter(
                    placement__academic_supervisor=user
                ).select_related('placement', 'placement__student')

        elif user.role == 'admin':
            # Admins see all logs
            return WeeklyLog.objects.all().select_related('placement', 'placement__student')

        return WeeklyLog.objects.none()

    def perform_create(self, serializer):
        # Ensure student can only create logs for their own placement
        placement = serializer.validated_data.get('placement')
        if self.request.user.role == 'student':
            if placement.student != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only create logs for your own placement.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a log for review."""
        log = self.get_object()

        # Only the student who owns the log can submit it
        if request.user.role == 'student' and log.placement.student != request.user:
            return Response(
                {'error': 'You can only submit your own logs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if log.status not in ['draft', 'returned']:
            return Response(
                {'error': 'Only draft or returned logs can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            log.submit()
            return Response(WeeklyLogSerializer(log).data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_logs(self, request):
        """Get all logs for the current student user."""
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is only for students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        logs = WeeklyLog.objects.filter(
            placement__student=request.user
        ).select_related('placement').order_by('-week_number')

        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data)
